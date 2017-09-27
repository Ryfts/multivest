# Ryfts Middleware

## Running
```sh
$ npm install
$ npm run build
$ node dist/app.js
```

## Configuration

ico.ethereumAddress - address of smart contract
ico.sinceBitcoinBlock  - since what bitcoin block you plan to receive bitcoin transactions
ico.validSince - since what date ico is valid, unix timestamp in seconds
ico.validTill - till what date ico is valid, unix timestamp in seconds
ico.bitcoin.minConfirmations - required number of bitcoin block confirmations to check for btc investments
ico.ethereum.fromAddress - valid unlocked account on geth
ico.ethereum.gasPrice - default gas price for ethereum transactions
ico.ethereum.gasLimit - default gas limit for ethereum transactions
db.mongo.url - mongodb connection url
agenda.mongodb.url - mongodb connection url
blockchain.bitcoin.network - bitcoin network
blcokchain.bitcoin.hd.masterPublicKey - bip32 master public key, that will be used to generate btc addresses for investings
blockchain.bitcoin.providers.native.network - bitcoin network
blockchain.bitcoin.providers.native.username - bitcoin client rpc username
blockchain.bitcoin.providers.native.password - bitcoin client rpc password
blockchain.ethereum.providers.native.url - geth json-rpc url
blockchain.ethereum.listener.sinceBlock - since what block ico starts on ethereum
