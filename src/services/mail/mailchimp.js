import config from 'config';
import logger from 'winston';

import Mailchimp from 'mailchimp-api-v3';

export default class MailchimpService {
    constructor() {
        this.apiKey = config.get('mailchimp.apiKey');
        this.listId = config.get('mailchimp.listId');

        if(this.apiKey.length > 0) {
            this.mailchimp = new Mailchimp(this.apiKey);
        }
    }

    subscribe(email) {
        if(this.mailchimp) {
            return mailchimp.post(`/lists/${ this.listId }/members`, {
                email_address: email,
                status : 'subscribed'
            })
                .catch((err) => logger.error(`failed to subscribe user with email ${email}`, err));
        }
        else {
            logger.warn('mailchimp is disabled, set proper apiKey');

            return Promise.resolve();
        }
    }
}