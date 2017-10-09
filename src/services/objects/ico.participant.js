import { ETHEREUM, BITCOIN } from '../utils/constant';
import BitcoinBlockchain from '../blockchain/bitcoin';
import DatabaseService from '../db/database';

export default class IcoAddressService {
    constructor() {
        this.database = new DatabaseService();
    }

    create(network, address) {
        const self = this;

        return this.database.getICOParticipantAddress(network, address)
            .then((participant) => {
                if(! participant) {
                    return self.database.createICOParticipantAddress(network, address);
                }
            });
    }

    getParticipant(network, address) {
        return this.database.getICOParticipantAddress(network, address);
    }
}
