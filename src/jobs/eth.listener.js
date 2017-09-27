import config from 'config';
import logger from 'winston';

import { ETHEREUM, TX_STATUS } from '../services/utils/constant';
import AbstractJob from './abstract.job';
import DatabaseService from '../services/db/database';
import EthereumService from '../services/blockchain/ethereum';

const AGENDA_JOB_TITLE = 'eth.listener';

export default class EthListener extends AbstractJob {
    constructor(agenda) {
        super(agenda);

        this.database = new DatabaseService();
        this.ethereum = new EthereumService();

        //@TODO: set min confirmations
        this.minConfirmation = 0;

        agenda.define(AGENDA_JOB_TITLE, (job, done) => {
            logger.info('ETH Listener: executing job');

            try {
                this.execute()
                    .then(() => done())
                    .catch(err => {
                        logger.error("ETH Listener", err);

                        done(err);
                    });
            }
            catch (err) {
                done(err);
            }
        });
    }

    execute() {
        let processingBlock;
        let processedBlockHeight;

        let job;

        return this.database.getJob(AGENDA_JOB_TITLE)
            .then((_job) => {
                if (!_job) {
                    return this.database.insertJob({
                        job: AGENDA_JOB_TITLE,
                        processedBlockHeight: config.get('blockchain.ethereum.listener.sinceBlock')
                    });
                }

                return _job;
            })
            .then((_job) => {
                job = _job;

                processedBlockHeight = job.processedBlockHeight;

                processingBlock = processedBlockHeight + 1;

                return this.ethereum.getBlockHeight();
            })
            // eslint-disable-next-line max-len
            .then(publishedBlockHeight => this.processBlocks(processingBlock, publishedBlockHeight));
    }

    processBlocks(processSinceBlock, publishedBlockHeight) {
        let promise = Promise.resolve();

        logger.info(`ETH Listener: processing blocks`, {
            processSinceBlock,
            publishedBlockHeight
        });

        let stopProcessing = false;

        // eslint-disable-next-line max-len
        for (let processingBlock = processSinceBlock; processingBlock < publishedBlockHeight; processingBlock += 1) {
            let block;

            promise = promise
                .then(() => this.ethereum.getBlockByHeight(processingBlock))
                .then((_block) => {
                    block = _block;

                    if (stopProcessing || (publishedBlockHeight - block.number) < this.minConfirmation) {
                        stopProcessing = true;

                        logger.info(`ETH Listener: skipping block, because it has less confirmations than expected`, {
                            skippingBlock: block.height,
                            minConfirmations: this.minConfirmation
                        });

                        return;
                    }

                    logger.info(`ETH listener: processing block`, {
                        block: processingBlock
                    });

                    return this.processBlock(block);
                })
                .then(() => {
                    if(stopProcessing == false) {
                        logger.info(`ETH Listener: updating job`, {
                            processedBlockHeight: block.number,
                            processedBlockTime: block.timestamp
                        });

                        return this.database.updateJob(AGENDA_JOB_TITLE, {
                            processedBlockHeight: block.number,
                            processedBlockTime: block.timestamp,
                        });
                    }
                });
        }

        return promise;
    }

    processBlock(block) {
        const txMapping = {};

        for (const tx of block.transactions) {
            txMapping[tx.hash] = tx;
        }

        if(block.transactions.length == 0) {
            return;
        }

        return this.database.getTransactionsByStatus(ETHEREUM, TX_STATUS.SENT)
            .then((transactions) => {
                const promises = [];

                for(let transaction of transactions) {
                    if(txMapping.hasOwnProperty(transaction.txHash)) {
                        const tx = txMapping[transaction.txHash];

                        logger.info(`ETH Listener: setting ethereum transaction mined block`, {
                            txHash: tx.hash,
                            block: {
                                hash: block.hash,
                                number: block.number,
                                timestamp: block.timestamp
                            }
                        });

                        promises.push(this.database.setTransactionMinedBlock(ETHEREUM, tx.hash, block.hash, block.number, block.timestamp));
                    }
                }

                if(promises.length == 0) {
                    return;
                }

                return Promise.all(promises);
            });
    }
}
