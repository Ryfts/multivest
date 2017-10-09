import express from 'express';

import IcoController from '../controllers/ico.controller';

export default class AddressRoutes extends express.Router {
    constructor(database) {
        super();

        this.controller = new IcoController(database);

        this.route('/addresses/eth').post(this.controller.getEthAddress.bind(this.controller));
        this.route('/addresses/btc').post(this.controller.createBtcAddress.bind(this.controller));
        this.route('/stats').get(this.controller.getStats.bind(this.controller));
        this.route('/exchange').get(this.controller.getExchange.bind(this.controller));
        this.route('/email').post(this.controller.subscribe.bind(this.controller));
    }
}
