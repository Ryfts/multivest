import { ETHEREUM, BITCOIN } from '../utils/constant';
import BitcoinBlockchain from '../blockchain/bitcoin';
import DatabaseService from '../db/database';

export default class IcoAddressService {
    constructor() {
        this.database = new DatabaseService();
        this.bitcoin = new BitcoinBlockchain(true);
    }

    create(forNetwork, forAddress) {
        const self = this;

        return this.database.getLastInvestmentAddress(BITCOIN)
            .then((lastInvestmentAddress) => {
                let derivedIndex = 1;

                if (lastInvestmentAddress && lastInvestmentAddress.length > 0) {
                    derivedIndex = lastInvestmentAddress[0].derivedIndex + 1;
                }

                const address = this.bitcoin.getHDAddress(derivedIndex);

                // eslint-disable-next-line max-len
                return self.database.createInvestmentAddress(BITCOIN, address, derivedIndex, forNetwork, forAddress);
            });
    }
}
