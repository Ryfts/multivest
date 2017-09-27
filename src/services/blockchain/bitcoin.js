import config from 'config';
import bitcoin from 'bitcoinjs-lib';
import Client from 'bitcoin-core';
import logger from 'winston';

import AbstractBlockchain from './abstract';

export default class BitcoinService extends AbstractBlockchain {
    constructor(fake) {
        super();

        if (!!fake === false) {
            this.client = new Client(config.get('blockchain.bitcoin.providers.native'));
        }
    }

    getHDAddress(index) {
        const networkBip32 = bitcoin.networks[config.get('blockchain.bitcoin.network')];

        const masterPublicKy = config.get('blockchain.bitcoin.hd.masterPublicKey');

        const hdNode = bitcoin.HDNode.fromBase58(masterPublicKy, networkBip32);

        return hdNode.derive(index).getAddress().toString();
    }

    isValidAddress(address) {
        try {
            bitcoin.Address.fromBase58Check(address);
        }
        catch (e) {
            return false;
        }

        return true;
    }

    async getBlockHeight() {
        return this.client.getBlockCount();
    }

    async getBlockByHeight(blockHeight) {
        const blockHash = await this.client.getBlockHash(blockHeight);

        return this.client.getBlockByHash(blockHash, { extension: 'json' });
    }

    async getTransactionByHash(txHash) {
        const tx = await this.client.getTransactionByHash(txHash, { extension: 'json', summary: true });

        return tx;
    }

    sendTransaction(from, to, amount, fee) {
        return this.client.sendTransaction(from, to, amount);
    }

    sendRawTransaction(txHex) {
        return this.client.sendRawTransaction(txHex);
    }

    getBalance(address, minConf=1) {
        return this.client.getBalance(address, minConf);
    }
}
