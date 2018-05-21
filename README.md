# Ryfts Middleware

## Requirements
- Node.js
- npm
- build-essential & libsasl2-dev (needed in case of `node-gyp rebuild` error during `npm install`)

## Running
```sh
$ npm install
$ npm run build
$ node dist/app.js
```

or with pm2 installed and set: `pm2 start app`.

## Running requirements
 - Ethereum RPC client i.e. `geth --rpc` with unlock arguments.
It is required to create a new account on geth that is unlocked (fromAddress in config).

 - MongoDB
 
 - Bitcoin client like Bitcoin Core's daemon `bitcoind`.
 It is required to set `server=1`, `rest=1` and `rpcuser=username` and `rpcpassword=password` in `bitcoin.conf` (login needed in config).
 
 OR
 
 - Bitcoin client like Electrum (recommended).
 See [here](http://docs.electrum.org/en/latest/merchant.html) how to import watch only wallet.
 Enable RPC: `electrum setconfig rpcport 8332`
 Get RPC user info: `electrum getconfig rpcuser` and `electrum getconfig rpcpassword`.
 Update those values in config.
 

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
blockchain.bitcoin.network - bitcoin network (i.e. testnet)
blcokchain.bitcoin.hd.masterPublicKey - bip32 master public key, that will be used to generate btc addresses for investings
blockchain.bitcoin.providers.native.host - localhost
blockchain.bitcoin.providers.native.network - bitcoin network (i.e. teestnet)
blockchain.bitcoin.providers.native.username - bitcoin client rpc username
blockchain.bitcoin.providers.native.password - bitcoin client rpc password
```
Ethereum client related config
```
blockchain.ethereum.providers.native.url - geth json-rpc url
blockchain.ethereum.listener.sinceBlock - since what block ico starts on ethereum
```

### Other things to do
* Set environment variable `PRODUCTION=1`.
* Set `fromAddress` as allowed multivest address in the contract.
* Send some ETH for the gas to `fromAddress`.
* Set ICO timing in frontend widget.
* Use Electrum wallet to generate addresses ([link](http://docs.electrum.org/en/latest/faq.html#how-can-i-pre-generate-new-addresses)) and master public key.
