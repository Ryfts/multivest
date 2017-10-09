import config from 'config';
import logger from 'winston';
import validator from 'email-validator';

import { BITCOIN, ETHEREUM } from '../services/utils/constant';
import IcoAddressService from '../services/objects/ico.address';
import IcoParticipantService from '../services/objects/ico.participant';
import IcoEmailSubscriptionService from '../services/objects/ico.subscription';
import EthereumService from '../services/blockchain/ethereum';
import SmartContractService from '../services/ico/smart.contract';
import Database from '../services/db/database';

export default class IcoController {
    constructor() {
        this.addressService = new IcoAddressService();
        this.participantService = new IcoParticipantService();
        this.emailSubscriptionService = new IcoEmailSubscriptionService();
        this.ethereumService = new EthereumService();
        this.smartContractService = new SmartContractService();
        this.database = new Database();
    }

    /**
     * @swagger
     * /ico/addresses/eth:
     *   post:
     *     tags:
     *       - Post ethereum address to participate in ico
     *     produces:
     *       - application/json
     *     parameters:
     *     - name: body
     *       in: body
     *       description: contributor ethereum address
     *       required: true
     *       type: string
     *       schema:
     *         properties:
     *           address:
     *             type: string
     *           acceptedTermsAndConditions:
     *             type: boolean
     *     responses:
     *       200:
     *         schema:
     *            properties:
     *              icoAddress:
     *                type: string
     */
    getEthAddress(req, res, next) {
        if(req.body.acceptedTermsAndConditions !== true) {
            res.json({
                error: "terms-and-conditions-required"
            });

            return;
        }

        if (! this.ethereumService.isValidAddress(req.body.address)) {
            res.json({
                error: 'not-valid-address',
            });

            return;
        }

        try {
            this.participantService.create(ETHEREUM, req.body.address)
                .then(() => {
                    res.json({
                        icoAddress: config.get('ico.ethereumAddress'),
                    });
                })
                .catch((err) => {
                    logger.error(err);

                    res.json({
                        error: 'internal-error',
                    });
                });
        }
        catch(err) {
            logger.error(err);

            next(err);
        }
    }

    /**
     * @swagger
     * /ico/addresses//btc:
     *   post:
     *     tags:
     *       - Generate bitcoin address to participate in ico
     *     produces:
     *       - application/json
     *     parameters:
     *     - name: body
     *       in: body
     *       description: contributor ethereum address
     *       required: true
     *       type: string
     *       schema:
     *         properties:
     *           address:
     *             type: string
     *           acceptedTermsAndConditions:
     *             type: boolean
     *     responses:
     *       200:
     *         schema:
     *            properties:
     *              icoAddress:
     *                type: string
     */
    createBtcAddress(req, res, next) {
        if(req.body.acceptedTermsAndConditions !== true) {
            res.json({
                error: "terms-and-conditions-required"
            });

            return;
        }

        if (! this.ethereumService.isValidAddress(req.body.address)) {
            res.json({
                error: 'not-valid-address',
            });

            return;
        }

        try {
            let icoAddress;

            this.addressService.create(ETHEREUM, req.body.address)
                .then((_icoAddress) => {
                    icoAddress = _icoAddress;

                    return this.participantService.create(ETHEREUM, req.body.address);
                })
                .then(() => {
                    res.json({
                        icoAddress: icoAddress.address,
                    });
                })
                .catch((err) => {
                    logger.error(err);

                    res.json({
                        error: 'internal-error',
                    });
                });
        }
        catch(err) {
            logger.erro(err);

            next(err);
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
     * /ico/exchange:
     *   get:
     *     tags:
     *       - Get currency exchange
     *     produces:
     *       - application/json
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

    /**
     * @swagger
     * /ico/email:
     *   post:
     *     tags:
     *       - Subscribe email
     *     parameters:
     *     - name: body
     *       in: body
     *       description: contributor ethereum address
     *       required: true
     *       type: string
     *       schema:
     *         properties:
     *           email:
     *             type: string
     *           network:
     *             type: string
     *             enum:
     *               - ETHEREUM
     *           address:
     *             type: string
     *     produces:
     *       - application/json
     *     responses:
     *       204:
     *         description: succeed
     */
    subscribe(req, res, next) {
        //@TODO: validate email

        if(! validator.validate(req.body.email)) {
            res.json({
                error: 'not-valid-email'
            });

            return;
        }

        if(req.body.network || req.body.address) {
            if(req.body.network !== ETHEREUM) {
                res.json({
                    error: 'not-valid-network'
                });

                return;
            }

            if (! this.ethereumService.isValidAddress(req.body.address)) {
                res.json({
                    error: 'not-valid-address',
                });

                return;
            }
        }

        try {
            let promise;

            if(req.body.network || req.body.address) {
                promise = this.participantService
                    .getParticipant(req.body.network, req.body.address);
            }
            else {
                promise = Promise.resolve();
            }

            promise
                .then((participant) => {
                    return this.emailSubscriptionService.create(req.body.email, req.body.network, req.body.address)
                        .then(() => {
                            res.status(204).send();
                        });
                })
                .catch((err) => {
                    logger.error(err);

                    res.json({
                        error: 'internal-error',
                    });
                });
        }
        catch(err) {
            logger.error(err);

            next(err);
        }
    }
}