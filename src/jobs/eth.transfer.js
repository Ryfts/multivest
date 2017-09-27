import config from 'config';
import logger from 'winston';

import { ETHEREUM, TX_STATUS } from '../services/utils/constant';
import AbstractJob from './abstract.job';
import DatabaseService from '../services/db/database';
import EthereumService from '../services/blockchain/ethereum';

export default class EthTransfer extends AbstractJob {
    constructor(agenda) {
        super(agenda);

        this.database = new DatabaseService();
        this.ethereum = new EthereumService();

        agenda.define('eth.transfer', (job, done) => {
            logger.info('ETH Transfer: executing job');

            try {
                this.execute()
                    .then(() => done())
                    .catch(err => {
                        logger.error("ETH Transfer", err);

                        done(err);
                    });
            }
            catch (err) {
                done(err);
            }
        });
    }

    execute() {
        return this.database.getTransactionsByStatus(ETHEREUM, TX_STATUS.CREATED)
            .then((transactions) => {
                let promise = Promise.resolve();

                for (const transaction of transactions) {
                    promise = promise
                        .then(() => {
                            logger.info('ETH Transfer: send transaction', transaction);

                            return this.ethereum.sendTransaction(
                                transaction.from,
                                transaction.to,
                                transaction.value,
                                transaction.extra.data,
                                transaction.extra.nonce,
                                transaction.extra.gasLimit,
                                transaction.extra.gasPrice)
                                .catch((error) => {
                                    logger.error(`transaction sending failed ${transaction._id}`, error);
                                })
                                .then(txHash => {
                                    if(txHash) {
                                        logger.info('ETH Transfer: transaction sent', {
                                            transaction,
                                            txHash
                                        });

                                        return this.database.setTransactionHashAndStatus(transaction._id, txHash, TX_STATUS.SENT);
                                    }
                                });
                        });
                }

                return promise;
            });
    }
}
