# OurCoin

**OurCoin** is an alternative implementation of the OurChain protocol, written in
JavaScript and C/C++ for Node.js.

It is base on [Bcoin](https://github.com/bcoin-org/bcoin)

## what is OurChain

bitcoin with 2 feature

- Smart Contract
- EPoW (More Efficient Consensus Mechanism)

## Uses

- Full Node
- ~~SPV Node~~
- ~~Wallet Backend~~
- ~~Mining Backend (getblocktemplate support)~~
- ~~Layer 2 Backend (lightning)~~
- ~~General Purpose Bitcoin Library~~

## Install

suggest Node version is v16

```
$ git clone https://github.com/leon123858/OurCoin.git
$ cd OurCoin
$ npm rebuild
$ ./bin/bcoin
```

See the [Getting started][guide] guide for more in-depth installation
instructions, including verifying releases. If you're upgrading, see the
latest changes via the [Changelog][changelog].

## Documentation For Bcoin

- General docs: [docs/](docs/README.md)
- Wallet and node API docs: https://bcoin.io/api-docs/
- Library API docs: https://bcoin.io/docs/

## Documentation For My Feature

all docs are in the project 'docs' folder

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

## Maintainer

National Taiwan University, department of CSIE, Lab of 408

## License

- Copyright (c) 2014-2015, Fedor Indutny (MIT License).
- Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).

See LICENSE for more info.
