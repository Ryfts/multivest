# Ryfts Middleware

## Running
```sh
$ npm install
$ npm run build
$ node dist/app.js
```

## Running requirements
 - Ethereum RPC client i.e. `geth --rpc`
 
It is required to create a new account on geth that is unlocked (fromAddress in config).
 
 - Bitcoin client like Bitcoin Core's daemon `bitcoind`.
 It is required to set `server=1` and `rpcuser=username` and `rpcpassword=password` in `bitcoin.conf` (login needed in config).

## Configuration
ICO related config
```
ico.ethereumAddress - address of deployed ICO smart contract
ico.sinceBitcoinBlock  - since which Bitcoin block you plan to receive bitcoin transactions
ico.validSince - since what date ICO is valid (unix timestamp in seconds)
ico.validTill - till what date ICO is valid (unix timestamp in seconds)
ico.bitcoin.minConfirmations - required number of Bitcoin block confirmations
ico.ethereum.fromAddress - valid unlocked account on geth. Address will send transactions on behalf of customer on BTC transactions
ico.ethereum.gasPrice - default gas price for ethereum transactions
ico.ethereum.gasLimit - default gas limit for ethereum transactions
```
Database related config
```
db.mongo.url - mongodb connection url
agenda.mongodb.url - mongodb connection url
```
Bitcoin client related config
```
blockchain.bitcoin.network - bitcoin network
blcokchain.bitcoin.hd.masterPublicKey - bip32 master public key, that will be used to generate btc addresses for investings
blockchain.bitcoin.providers.native.network - bitcoin network
blockchain.bitcoin.providers.native.username - bitcoin client rpc username
blockchain.bitcoin.providers.native.password - bitcoin client rpc password
```
Ethereum client related config
```
blockchain.ethereum.providers.native.url - geth json-rpc url
blockchain.ethereum.listener.sinceBlock - since what block ico starts on ethereum
```