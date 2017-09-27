import config from 'config';
import logger from 'winston';
import rp from 'request-promise';

import AbstractJob from './abstract.job';
import DatabaseService from '../services/db/database';

const AGENDA_JOB_TITLE = 'coinmarketcap.exchange';

export default class CoinMarketCapExchange extends AbstractJob {
    constructor(agenda) {
        super(agenda);

        this.database = new DatabaseService();
        this.whitelisted = config.get('exchanges.whitelist');

        agenda.define(AGENDA_JOB_TITLE, (job, done) => {
            logger.info('CoinMarketCapEchange: executing job');

            try {
                this.execute()
                    .then(() => done)
                    .catch((err) => {
                        logger.error("CoinMarketCapEchange", err);

                        done(err);
                    });
            }
            catch (err) {
                done(err);
            }
        });
    }

    execute() {
        const options = {
            url: 'https://api.coinmarketcap.com/v1/ticker/',
            json: true,
        };

        const rates = {};

        return rp(options)
            .then((response) => {
                for (const currency of response) {
                    if (this.whitelisted.includes(currency.symbol)) {
                        const btcKey = `${currency.symbol}_BTC`;
                        const usdKey = `${currency.symbol}_USD`;

                        rates[btcKey] = currency.price_btc;
                        rates[usdKey] = currency.price_usd;
                    }
                }

                const obj = {
                    rates,
                    createdAt: new Date(),
                };

                return this.database.addExchangeRates(obj);
            })
            .catch((error) => {
                logger.error('CoinMarketCapEchange, failed to get currency rates', error);
            });
    }
}
