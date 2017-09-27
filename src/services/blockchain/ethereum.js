import config from 'config';
import EthereumBip44 from 'ethereum-bip44';
import web3 from 'web3';

import AbstractBlockchain from './abstract';

export default class EthereumService extends AbstractBlockchain {
    constructor(fake) {
        super();

        if (!!fake == false) {
            this.clientProvider = new web3.providers.HttpProvider(config.get('blockchain.ethereum.providers.native.url'));

            this.client = new web3(this.clientProvider);
        }
    }

    getHDAddress(index) {
        const masterPublicKey = config.get('blockchain.bitcoin.hd.masterPublicKey');

        const wallet = EthereumBip44.fromPublicSeed(masterPublicKey);

        return wallet.getAddress(index);
    }

    isValidAddress(address) {
        return web3.utils.isAddress(address);
    }

    async getBlockHeight() {
        return this.client.eth.getBlockNumber();
    }

    async getBlockByHeight(blockHeight) {
        return this.client.eth.getBlock(blockHeight, true);
    }

    async getTransactionByHash(txHash) {
        return this.client.eth.getTransaction(txHash);
    }

    async sendTransaction(from, to, value, data, nonce, gasLimit, gasPrice) {
        return new Promise((resolve, reject) => {
            this.client.eth.sendTransaction({
                from,
                to,
                value,
                nonce,
                gas: gasLimit,
                gasPrice,
                data,
            }, function(error, txHash) {
                if(error) {
                    reject(error);
                }
                else {
                    resolve(txHash);
                }
            })
        });
    }

    async sendRawTransaction(txHex) {
        return this.client.eth.sendSignedTransaction(txHex);
    }

    async call(from, to, data) {
        return this.client.eth.call({
            from: from,
            to: to,
            data: data,
        });
    }

    async getBalance(address, minConf) {
        if(minConf && minConf > 0) {
            throw new Error("minConf is not supported");
        }

        return this.client.eth.getBalance(address);
    }

    async estimateGas(from, to, data) {
        return this.client.eth.estimateGas({
            from: from,
            to: to,
            data: data,
        });
    }
}
