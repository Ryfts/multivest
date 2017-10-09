import web3 from 'web3';
import config from 'config';
import logger from 'winston';
import BigNumber from 'bignumber.js';

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

            tokensPerEth: 0,
            tokensPerBTC: 0,

            collected: {
                eth: 0,
                btc: 0,
            },
        };

        let contractBalance;
        let tokensSold;
        let tokensForSale;

        let precision = new BigNumber(10).pow(8);

        return this.icoContract.methods.soldTokens().call()
            .then((result) => {
                tokensSold = new BigNumber(result);

                stats.tokensSold = tokensSold.div(precision).valueOf();

                return this.icoContract.methods.balanceOf(config.get('ico.ethereumAddress')).call();
            })
            .then((result) => {
                tokensForSale = new BigNumber(result);

                stats.tokensForSale = tokensForSale.div(precision).valueOf();

                const tokensSold = new BigNumber(stats.tokensSold);
                const allocatedTokensForSale = new BigNumber(tokensSold).plus(stats.tokensForSale);

                stats.soldPercentage = tokensSold.div(allocatedTokensForSale).toFixed(2);

                return this.icoContract.methods.tokenPrice().call();
            })
            .then((result) => {
                stats.tokenPrice = result.valueOf();

                return this.database.getExchangeRates()
            })
            .then(exchangRates => {
                let tokensPerEth = new BigNumber(10).pow(18).div(stats.tokenPrice);

                stats.tokensPerEth = tokensPerEth.toFixed(2);
                stats.tokensPerBTC = tokensPerEth.mul(new BigNumber(1).div(exchangRates.rates.ETH_BTC)).toFixed(2);

                return this.icoContract.methods.collectedEthers().call();
            })
            .then((result) => {
                stats.collected.eth = new BigNumber(result).div(new BigNumber(10).pow(18)).toFixed(2);

                return this.database.getTotalInvstments('BITCOIN');
            })
            .then((results) => {
                if(results.length > 0) {
                    stats.collected.btc = results[0].totalAmount;
                }

                return stats;
            });
    }
}
