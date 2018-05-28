import config from 'config';
import logger from 'winston';
import web3 from 'web3';
import BigNumber from 'bignumber.js';
import contract from "truffle-contract";

import ContractArtifact from '../Ryfts.json';
import { ETHEREUM, BITCOIN } from '../services/utils/constant';
import AbstractJob from './abstract.job';
import DatabaseService from '../services/db/database';
import BitcoinService from '../services/blockchain/bitcoin';

export default class IcoBTCListener extends AbstractJob {
    constructor(agenda) {
        super(agenda);

        this.database = new DatabaseService();
        this.bitcoin = new BitcoinService();

        this.minConfirmation = config.get('ico.bitcoin.minConfirmations');

        this.icoSinceBlock = config.get('ico.sinceBitcoinBlock');

        this.icoValidSince = config.get('ico.validSince');
        this.icoValidTill = config.get('ico.validTill');

        this.web3 = new web3();

        const abi = contract(ContractArtifact).abi;
        this.icoContract = new this.web3.eth.Contract(abi);

        agenda.define('ico.btc.listener', (job, done) => {
            logger.info('BTC Listener: executing job');

            try {
                this.execute()
                    .then(() => done())
                    .catch((err) => {
                        logger.error("BTC Listener", err);

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

        return this.database.getJob('ico.btc.listener')
            .then((_job) => {
                if (!_job) {
                    return this.database.insertJob({ job: 'ico.btc.listener', processedBlockHeight: this.icoSinceBlock });
                }

                return _job;
            })
            .then((_job) => {
                job = _job;

                processedBlockHeight = job.processedBlockHeight;

                processingBlock = processedBlockHeight + 1;

                return this.bitcoin.getBlockHeight();
            })
            // eslint-disable-next-line max-len
            .then(publishedBlockHeight => this.processBlocks(processingBlock, publishedBlockHeight));
    }

    processBlocks(processSinceBlock, publishedBlockHeight) {
        let promise = Promise.resolve();

        logger.info(`BTC listener: process blocks since ${processSinceBlock} till ${publishedBlockHeight}`);

        let stopProcessing = false;

        // eslint-disable-next-line max-len
        for (let processingBlock = processSinceBlock; processingBlock < publishedBlockHeight; processingBlock += 1) {
            let block;

            promise = promise
                .then(() => this.bitcoin.getBlockByHeight(processingBlock))
                .then((_block) => {
                    block = _block;

                    if (stopProcessing || block.confirmations < this.minConfirmation) {
                        stopProcessing = true;

                        logger.info(`BTC Listener: skipping block ${block.height}, because has less confirmations than ${this.minConfirmation}`);

                        return;
                    }

                    logger.info(`BTC listener: processing block ${processingBlock}`);

                    return this.processBlock(block)
                })
                .then(() => {
                    logger.info(`BTC Listener: updating job, processedBlockHeight: ${block.height}, processedBlockTime: ${block.time}`);

                    if(stopProcessing == false) {
                        return this.database.updateJob('ico.btc.listener', {
                            processedBlockHeight: block.height,
                            processedBlockTime: block.time,
                        });
                    }
                });
        }

        return promise;
    }

    processBlock(block) {
        const receivers = [];
        const receiversMapping = {};

        for (const tx of block.tx) {
            for (const vout of tx.vout) {
                if (vout.scriptPubKey && vout.scriptPubKey.addresses) {
                    if (vout.scriptPubKey.addresses.length === 1) {
                        const address = vout.scriptPubKey.addresses[0];

                        if (!Object.prototype.hasOwnProperty.call(receiversMapping, address)) {
                            receivers.push(address);

                            receiversMapping[address] = [];
                        }

                        vout.tx = tx;

                        receiversMapping[address].push(vout);
                    }
                }
            }
        }

        let promise = Promise.resolve();

        let exchangeRates;

        return this.database.getExchangeRates()
            .then((_exchangeRates) => {
                exchangeRates = _exchangeRates;

                return this.database.findIcoAddresses(BITCOIN, receivers);
            })
            .then((icoAddresses) => {
                for (const icoAddress of icoAddresses) {
                    for (const vout of receiversMapping[icoAddress.address]) {
                        if (block.time >= this.icoValidSince && block.time <= this.icoValidTill) {
                            let btc2eth;

                            if(exchangeRates.rates.BTC_ETH) {
                                btc2eth = new BigNumber(exchangeRates.rates.BTC_ETH);
                            }
                            else if(exchangeRates.rates.ETH_BTC) {
                                btc2eth = new BigNumber(1)
                                    .div(new BigNumber(exchangeRates.rates.ETH_BTC));
                            }
                            else {
                                throw new Error("no exchange rates for pair BTC=>ETH")
                            }

                            const ethersToTransfer = btc2eth
                                .mul(vout.value)
                                .mul("1000000000000000000")
                                .toFixed(0).valueOf();

                            // eslint-disable-next-line max-len
                            const data = this.icoContract.methods.multivestBuy(icoAddress.forAddress, ethersToTransfer). encodeABI();

                            logger.info(`BTC Listener: creating ethereum transaction for bitcoin originated transaction ${icoAddress.address} vout ${vout.n} to fund ethereum address ${icoAddress.forAddress}`);

                            let uniqId = `${vout.tx.hash}-${vout.n}`;

                            promise = promise
                                .then(() => {
                                    return this.database.getInvestmentByUniqId(BITCOIN, uniqId);
                                })
                                .then(investment => {
                                    if(investment) {
                                        logger.info(`Skipping investment with uniqId ${uniqId}`);
                                    }
                                    else {
                                        logger.info(`Creating investment with uniqId ${uniqId}`);

                                        return this.database.createInvestment(BITCOIN, uniqId, vout.tx.hash, vout.n, vout.value, icoAddress._id)
                                    }
                                })
                                .then(() => {
                                    return this.database.getTransactionByUniqId(ETHEREUM, uniqId);
                                })
                                .then((existingTransaction) => {
                                    if(existingTransaction) {
                                        logger.info(`skipping creation of ethereum transaction because it exists with uniq id ${uniqId}`);
                                    }
                                    else {
                                        return this.database.getTransactionsCountByAddress(ETHEREUM, config.get('ico.ethereum.fromAddress'))
                                            .then((txCount) => {
                                                logger.info(`creating ethereum transaction with uniqId ${uniqId} and nonce ${txCount}`);

                                                return this.database.createTransaction(
                                                    uniqId,

                                                    ETHEREUM,

                                                    null,

                                                    config.get('ico.ethereum.fromAddress'),
                                                    config.get('ico.ethereumAddress'),

                                                    "0", // ethers,
                                                    null, // fee,

                                                    {
                                                        data,
                                                        nonce: txCount,
                                                        gasPrice: config.get('ico.ethereum.gasPrice'),
                                                        gasLimit: config.get('ico.ethereum.gasLimit'),
                                                    },
                                                );
                                            });
                                    }
                                });
                        }
                    }
                }

                return promise;
            });
    }
}
