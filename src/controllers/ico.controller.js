import config from 'config';

import { ETHEREUM } from '../services/utils/constant';
import IcoAddressService from '../services/objects/ico.address';
import EthereumService from '../services/blockchain/ethereum';
import SmartContractService from '../services/ico/smart.contract';
import Database from '../services/db/database';

export default class IcoController {
    constructor() {
        this.addressService = new IcoAddressService();
        this.ethereumService = new EthereumService();
        this.smartContractService = new SmartContractService();
        this.database = new Database();
    }

    /**
     * @swagger
     * /ico/addresses/eth:
     *   post:
     *     tags:
     *       - Generate bitcoin address to participate in ico
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         schema:
     *            properties:
     *              icoAddress:
     *                type: string
     */
    getEthAddress(req, res, next) {
        res.json({
            icoAddress: config.get('ico.ethereumAddress'),
        });
    }

    /**
     * @swagger
     * /ico/addresses//btc:
     *   post:
     *     tags:
     *       - Generate bitcoin address to participate in ico
     *     produces:
     *       - application/json
     *     schema:
     *       properties:
     *         address:
     *           type: string
     *     responses:
     *       200:
     *         schema:
     *            properties:
     *              icoAddress:
     *                type: string
     */
    createBtcAddress(req, res, next) {
        if (! this.ethereumService.isValidAddress(req.body.address)) {
            res.json({
                error: 'not-valid-address',
            });

            return;
        }

        try {
            this.addressService.create(ETHEREUM, req.body.address)
                .then((icoAddress) => {
                    res.json({
                        icoAddress: icoAddress.address,
                    });
                })
                .catch((err) => {
                    res.json({
                        error: 'internal-error',
                    });
                });
        }
        catch(err) {
            console.log(err);
        }
    }

    /**
     * @swagger
     * /ico/stats:
     *   get:
     *     tags:
     *       - Get ICO stats
     *     produces:
     *       - application/json
     *     schema:
     *       properties:
     *         ethereumAddress:
     *           type: string
     *     responses:
     *       200:
     *         schema:
     *            properties:
     *              tokensSold:
     *                type: number
     *              tokensForSale:
     *                type: number
     *              tokensPrice:
     *                type: number,
     *              collected:
     *                type: object
     *                properties:
     *                  eth:
     *                    type: number
     *                  btc:
     *                    type: number
     */
    getStats(req, res, next) {

        this.smartContractService.getStats()
            .then(obj => res.json(obj))
            .catch(err => {
                logger.error(`failed to get ico stats`, err);
                next(err)
            });
        //
        // res.json({
        //     tokensSold: 0,
        //     tokensForSale: 0,
        //     tokenPrice: 0,
        //     collected: {
        //         eth: 0,
        //         btc: 0,
        //     },
        // });
    }

    /**
     * @swagger
     * /ico/status:
     *   post:
     *     tags:
     *       - Generate bitcoin address to participate in ico
     *     produces:
     *       - application/json
     *     schema:
     *       properties:
     *         ethereumAddress:
     *           type: string
     *     responses:
     *       200:
     *         schema:
     *            properties:
     *              eth2btc:
     *                type: number
     *              btc2eth:
     *                type: number
     *              eth2usd:
     *                type: number
     */
    getExchange(req, res, next) {
        this.database.getExchangeRates()
            .then(exchangRates => res.json({
                eth2btc: exchangRates.rates.ETH_BTC,
                btc2usd: exchangRates.rates.BTC_USD,
                eth2usd: exchangRates.rates.ETH_USD,
            }))
            .catch(err => next(err));
    }
}
