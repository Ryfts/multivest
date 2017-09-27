import express from 'express';

import IcoRoutes from './ico.route';
import SwaggerRoutes from './swagger.route';

export default class IndexRouter extends express.Router {
    constructor() {
        super();

        this.get('/healthz', (req, res) => {
            const errors = [];

            if (errors.length === 0) {
                res.send('OK');
            }
            else {
                res.status(500).send(errors.join(', '));
            }
        });

        // mount passport routes at /passport
        this.use('/ico', new IcoRoutes());

        this.use('/swagger', new SwaggerRoutes());
    }
}
