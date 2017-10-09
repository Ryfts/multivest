import logger from 'winston';
import config from 'config';

import { ETHEREUM, BITCOIN } from '../utils/constant';
import BitcoinBlockchain from '../blockchain/bitcoin';
import DatabaseService from '../db/database';
import MailchimpService from '../mail/mailchimp';

export default class IcoAddressService {
    constructor() {
        this.database = new DatabaseService();
        this.mailchimp = new MailchimpService();
    }

    create(email, network, address) {
        const self = this;

        return self.database.getEmailSubscription(email, network, address)
            .then((subscription) => {
                if(! subscription) {
                    return self.database.createEmailSubscription(email, network, address)
                }
            })
            .then(() => {
                return self.mailchimp.subscribe(email);
            })
            .then(() => logger.info(`Email ${email} subscribed`));
    }
}
