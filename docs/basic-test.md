# How to generate coin in regtest

```shell
yarn start
# get origin balance
./bin/bwallet-cli --network=regtest --api-key=test rpc getbalance
# get my wallet address
./bin/bwallet-cli --network=regtest --api-key=test rpc getnewaddress
# generate(mining)
./bin/bcoin-cli --network=regtest --api-key=test rpc generatetoaddress 100 [wallet Address]
# check result
./bin/bcoin-cli --network=regtest --api-key=test rpc getblockchaininfo
./bin/bwallet-cli --network=regtest --api-key=test rpc getbalance
yarn stop
```
