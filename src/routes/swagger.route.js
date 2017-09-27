import config from 'config';
import express from 'express';

var swaggerJSDoc = require('swagger-jsdoc');

export default class SwaggerRoutes extends express.Router {
    constructor() {
        super();

        var options = {
            // import swaggerDefinitions
            swaggerDefinition: {
                info: {
                    title: 'Ryfts API', // Title (required)
                    version: '1.0.0', // Version (required)
                },
                host: 'example.com',
                basePath: '/api',
            },
            // path to the API docs
            apis: ['./src/controllers/*.js'],
        };

        var swaggerSpec = swaggerJSDoc(options);

        this.route('/api-docs.json')
            .get(function(req, res) {
                res.setHeader('Content-Type', 'application/json');
                res.send(swaggerSpec);
            });
    }
}