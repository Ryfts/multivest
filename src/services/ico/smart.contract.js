import web3 from 'web3';
import config from 'config';
import BigNumber from 'bignumber.js';
import contract from 'truffle-contract';

import ContractArtifact from '../../Ryfts.json';
import Database from '../db/database';

export default class SmartContract {
    constructor() {
        this.database = new Database();

        this.clientProvider = new web3.providers.HttpProvider(config.get('blockchain.ethereum.providers.native.url'));

        this.client = new web3(this.clientProvider);

        const abi = contract(ContractArtifact).abi;
        this.icoContract = new this.client.eth.Contract(abi, config.get('ico.ethereumAddress'));
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

        let tokensSold;
        let tokensForSale;
        let phase;

        const precision = new BigNumber(10).pow(18);
        const currentTime = new Date().getTime();

        return this.icoContract.methods.getCurrentPhase(currentTime).call()
            .then(async (phaseNumber) => {
                phase = await this.icoContract.methods.phases(phaseNumber).call();
                tokensSold = phase.soldTokens;

                stats.tokensSold = tokensSold.div(precision).valueOf();

                return this.icoContract.methods.balanceOf(config.get('ico.ethereumAddress')).call();
            })
            .then(async(result) => {
                tokensForSale = result;
                stats.tokensForSale = tokensForSale.div(precision).valueOf();

                const tokensSold = new BigNumber(stats.tokensSold);
                const allocatedTokensForSale = tokensSold.plus(stats.tokensForSale);

                stats.soldPercentage = tokensSold.div(allocatedTokensForSale).toFixed(2);

                return phase.price;
            })
            .then((result) => {
                stats.tokenPrice = result.valueOf();

                return this.database.getExchangeRates();
            })
            .then(exchangRates => {
                const tokensPerEth = new BigNumber(10).pow(18).div(stats.tokenPrice);

                stats.tokensPerEth = tokensPerEth.toFixed(2);
                stats.tokensPerBTC = tokensPerEth.mul(new BigNumber(1).div(exchangRates.rates.ETH_BTC)).toFixed(2);

                return this.icoContract.methods.collectedEthers().call();
            })
            .then((result) => {
                stats.collected.eth = result.div(new BigNumber(10).pow(18)).toFixed(2);

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
