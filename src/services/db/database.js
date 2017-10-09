/* eslint-disable max-len */
import mongodb from 'mongodb';
import config from 'config';
import logger from 'winston';

import { TX_STATUS } from '../utils/constant';

const MongoClient = mongodb.MongoClient;

export default class DatabaseService {
    constructor() {
        this.connected = false;

        this.getCollections();
    }

    getCollections() {
        if (this.connected) {
            return Promise.resolve(this.collections);
        }

        const self = this;

        logger.info(`Mongodb url ${config.get('db.mongo.url')}`);

        if (!this.connectionPromise) {
            this.connectionPromise = new Promise((resolve, reject) => {
                MongoClient.connect(config.get('db.mongo.url'), (err, db) => {
                    if (err) {
                        reject(err);

                        return;
                    }

                    self.connected = true;
                    self.db = db;

                    self.collections = {
                        icoAddresses: db.collection('icoAddresses'),
                        jobs: db.collection('icoJobs'),
                        transactions: db.collection('transactions'),
                        exchanges: db.collection('exchanges'),
                        icoInvestments: db.collection('icoInvestments'),
                        icoParticipants: db.collection('icoParticipants'),
                        icoEmailSubscriptions: db.collection('icoEmailSubscriptions')
                    };

                    resolve(self.collections);
                });
            });
        }

        return this.connectionPromise;
    }

    getJob(job) {
        return this.getCollections()
            .then(collections => collections.jobs.findOne({ job }));
    }

    insertJob(job) {
        return this.getCollections()
            .then(collections => collections.jobs.insert(job))
            .then(() => job);
    }

    updateJob(job, data) {
        return this.getCollections()
            .then(collections => collections.jobs.update({ job }, { $set: data }));
    }

    createInvestmentAddress(network, address, derivedIndex, forNetwork, forAddress) {
        const obj = {
            network,
            address,
            derivedIndex,
            forNetwork,
            forAddress,
            collected: {
                total: 0,
                txs: [],
            },
            refunded: {
                total: 0,
                txs: [],
            },
            createdAt: new Date(),
        };

        return this.getCollections()
            .then((collections) => {
                return collections.icoAddresses.insert(obj);
            })
            .then(() => obj);
    }

    createICOParticipantAddress(network, address) {
        const obj = {
            network,
            address,
            createdAt: new Date()
        };

        return this.getCollections()
            .then((collections) => {
                return collections.icoParticipants.insert(obj)
            })
            .then(() => obj);
    }

    getICOParticipantAddress(network, address) {
        return this.getCollections()
            .then((collections) => {
                return collections.icoParticipants.findOne({ network, address });
            });
    }

    createEmailSubscription(email, network, address) {
        return this.getCollections()
            .then((collections) => {
                return collections.icoEmailSubscriptions.insert({ email, network, address });
            });
    }

    getEmailSubscription(email, network, address) {
        return this.getCollections()
            .then((collections) => {
                return collections.icoEmailSubscriptions.find({ email, network, address });
            });
    }

    getInvestmentAddressesForNetowrk(network) {
        return this.getCollections()
            .then(collections => collections.icoAddresses.find({ network }).toArray());
    }

    getLastInvestmentAddress(network) {
        return this.getCollections()
            .then(collections =>
                collections.icoAddresses.find({ network }).sort({ _id: -1 }).limit(1).toArray());
    }

    findIcoAddresses(network, addresses) {
        return this.getCollections()
            .then(collections => collections.icoAddresses.find({ network, address: { $in: addresses } }).toArray());
    }

    getInvestmentByUniqId(network, uniqId) {
        return this.getCollections()
            .then(collections => collections.icoInvestments.find({
                network,
                uniqId,
            }));
    }

    createInvestment(network, uniqId, txHash, id, amount, icoAddressId) {
        return this.getCollections()
            .then(collections => collections.icoInvestments.insert({
                network,
                uniqId,
                txHash,
                id,
                amount,
                icoAddressId
            }));
    }

    getTotalInvstments(network) {
        return this.getCollections()
            .then(collections => {
                return collections.icoInvestments.aggregate([
                        {
                            $group: {
                                    _id: { network },
                                    totalAmount: { $sum: "$amount" }
                            }
                        }
                    ]
                ).toArray();
            });
    }

    createTransaction(uniqId, network, txHash, from, to, value, fee, extra) {
        return this.getCollections()
            .then(collections => collections.transactions.insert({
                uniqId,
                network,
                txHash,
                from,
                to,
                value,
                fee,
                extra,
                status: TX_STATUS.CREATED,
                created: new Date(),
            }, { writeConcern: { w: "majority", wtimeout: 5000 } }));
    }

    setTransactionMinedBlock(network, txHash, hash, number, time) {
        return this.getCollections()
            .then(collections => collections.transactions.update(
                { network, txHash },
                { $set: { block: { hash, number, time }, status: TX_STATUS.MINED } },
            ));
    }

    updateTransaction(network, txHash, status) {
        return this.getCollections()
            .then(collections => collections.transactions.update(
                { network, txHash },
                { $set: { status } },
            ));
    }

    getTransactionsByStatus(network, status) {
        return this.getCollections()
            .then(collections => collections.transactions.find(
                {
                    network,
                    status,
                },
            ).toArray());
    }

    getTransactionByUniqId(network, uniqId) {
        return this.getCollections()
            .then(collections => collections.transactions.findOne(
                {
                    network,
                    uniqId,
                },
            ));
    }

    getTransactionsCountByAddress(network, address) {
        return this.getCollections()
            .then(collections => collections.transactions.count(
                {
                    network,
                    from: address
                }
            ));
    }

    setTransactionHashAndStatus(_id, txHash, status) {
        return this.getCollections()
            .then(collections => collections.transactions.update(
                { _id },
                {
                    $set: {
                        txHash,
                        status,
                    },
                },
            ));
    }

    getExchangeRates() {
        return this.getCollections()
            .then(collections => collections.exchanges.find({}).sort({ _id: -1 }).limit(1).toArray())
            .then(exchanges => {
                if(exchanges.length == 1) {
                    return exchanges[0];
                }
            });
    }

    addExchangeRates(rates) {
        return this.getCollections()
            .then(collections => collections.exchanges.insert(rates));
    }
}
