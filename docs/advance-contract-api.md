# advance contract API

## state load

```js
// global variable 'state' is last time contract state
const oldState = { ...state };
```

## state store

```js
// final variable 'state' in execute may store as state
state = { ...newState };
```

## get argument for contract

```js
// global variable 'args' is the argument for contract execute
const myArguments = { ...args };
```

## call other contract by contract Id

```js
// 在合約內執行另一份合約, 回傳是該合約結束時的 state, 參數是合約號碼以及執行所需參數
const otherState = await execTransaction(contractId, argsForExecute);
// example
await execTransaction(args.id,${JSON.stringify({
        action: "create",
        url: "https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png",
        title: "contract call",
      })})
```
