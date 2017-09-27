import Agenda from 'agenda';
import config from 'config';
import logger from 'winston';

import IcoBTCListener from './jobs/ico.btc.listener';
import CoinMarketCapExchange from './jobs/coinmarketcap.exchange';
import EthListenerJob from './jobs/eth.listener';
import EthTransferJob from './jobs/eth.transfer';

logger.info(`Agenda mongodb url ${config.get('agenda.mongodb.url')}`);

const agenda = new Agenda({ db: { address: config.get('agenda.mongodb.url') } });

// eslint-disable-next-line no-unused-vars
const icoBTCListener = new IcoBTCListener(agenda);
// eslint-disable-next-line no-unused-vars
const coinMarketCapExchange = new CoinMarketCapExchange(agenda);
// eslint-disable-next-line no-unused-vars
const ethListenerJob = new EthListenerJob(agenda);
// eslint-disable-next-line no-unused-vars
const ethTransferJob = new EthTransferJob(agenda);

setTimeout(() => agenda.start(), 15000);

agenda.on('ready', () => {
    agenda.every('15 seconds', 'ico.btc.listener');
    agenda.every('1 minute', 'coinmarketcap.exchange');
    agenda.every('15 seconds', 'eth.listener');
    agenda.every('15 seconds', 'eth.transfer');

    agenda.start();
});

export default {
    agenda,
};
