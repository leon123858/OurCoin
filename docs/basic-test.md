# How to generate coin in regtest

```shell
yarn start
# get origin balance
./bin/bwallet-cli --network=regtest --api-key=test rpc getbalance
# get my wallet address
./bin/bwallet-cli --network=regtest --api-key=test rpc getnewaddress
# get my wallet address
./bin/bwallet-cli --network=regtest --api-key=test rpc getaccountaddress "default"
# generate(mining)
./bin/bcoin-cli --network=regtest --api-key=test rpc generatetoaddress 100 [wallet Address]
# check result
./bin/bcoin-cli --network=regtest --api-key=test rpc getblockchaininfo
./bin/bwallet-cli --network=regtest --api-key=test rpc getbalance
yarn stop
```

# How to run contract in regtest

note: should run a mongodb local

```shell
yarn start
# 發佈程式碼 會回傳=>合約地址 ex:34477beb-5d66-447f-8d4b-9f8301a6c460
./bin/bwallet-cli --network=regtest --api-key=test rpc deploycontract "合約程式碼"
# 挖礦完成發布
./bin/bcoin-cli --network=regtest --api-key=test rpc generatetoaddress 1 [wallet Address]
# 執行合約
./bin/bwallet-cli --network=regtest --api-key=test rpc callcontract [contract Address] '合約參數(json物件)'
# 挖礦完成執行
./bin/bcoin-cli --network=regtest --api-key=test rpc generatetoaddress 1 [wallet Address]
# 試著轉移合約擁有權
./bin/bwallet-cli --network=regtest --api-key=test rpc transfercontract [contract Address] [new Owner address]
# 挖礦完成轉移
./bin/bcoin-cli --network=regtest --api-key=test rpc generatetoaddress 1 [wallet Address]
yarn stop
```

範例合約程式碼

```js
state.number = state.number ? state.number + 1 : 1;
if (!state.message) state["message"] = args.message;
```

範例合約參數

```json
{ "message": "Hello rpc contract" }
```

進階合約程式碼

```js
if (!state.NFT) state.NFT = [];
if (args.action == "create") {
  state["NFT"].push({ url: args.url, title: args.title });
}
```
