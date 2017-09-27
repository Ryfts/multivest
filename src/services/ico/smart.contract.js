import web3 from 'web3';
import config from 'config';
import logger from 'winston';

import Database from '../db/database.js';

export default class SmartContract {
    constructor() {
        this.database = new Database();

        this.clientProvider = new web3.providers.HttpProvider(config.get('blockchain.ethereum.providers.native.url'));

        this.client = new web3(this.clientProvider);

        this.icoContract = new this.client.eth.Contract(config.get('ico.ethereum.abi'), config.get('ico.ethereumAddress'));
    }

    getStats() {
        let stats = {
            tokensSold: 0,
            tokensForSale: 0,
            tokenPrice: 0,
            collected: {
                eth: 0,
                btc: 0,
            },
        };

        let contractBalance;

        return this.icoContract.methods.soldTokens().call()
            .then((result) => {
                stats.tokensSold = result.valueOf();

                return this.icoContract.methods.balanceOf(config.get('ico.ethereumAddress')).call();
            })
            .then((result) => {
                stats.tokensForSale = result.valueOf();

                return this.icoContract.methods.tokenPrice().call();
            })
            .then((result) => {
                stats.tokenPrice = result.valueOf();

                return this.icoContract.methods.collectedEthers().call();
            })
            .then((result) => {
                stats.collected.eth = result.valueOf();

                return this.database.getTotalInvstments('BITCOIN');
            })
            .then((results) => {
                if(results.length > 0) {
                    stats.collected.btc = results[0].totalAmount;
                }

                return stats;
            })
            .catch((err) => {
                logger.error(err);
            });
    }
}
