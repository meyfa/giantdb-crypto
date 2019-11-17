# giantdb-crypto

[![Build Status](https://travis-ci.com/meyfa/giantdb-crypto.svg?branch=master)](https://travis-ci.com/meyfa/giantdb-crypto)
[![Test Coverage](https://api.codeclimate.com/v1/badges/961375c3057ac63be2ad/test_coverage)](https://codeclimate.com/github/meyfa/giantdb-crypto/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/961375c3057ac63be2ad/maintainability)](https://codeclimate.com/github/meyfa/giantdb-crypto/maintainability)

[GiantDB](https://github.com/meyfa/giantdb) middleware for object encryption

## Install

```
npm i giantdb-crypto
```

## Setup

Example:

```javascript
const GiantDB = require("giantdb");
const GiantDBCrypto = require("giantdb-crypto");

const db = new GiantDB();

// register the middleware
db.use(new GiantDBCrypto());
```

That's all there is to it!

Note that this middleware cannot be added in retrospect. Items not previously
encrypted will cause errors when it is suddenly introduced.

## Usage

You will need to provide an **encryption key** with every action that reads or
writes items. Examples:

```javascript
const options = {
    encryption: {
        key: /* your encryption key (any 24-byte Buffer) */,
    },
};

db.create(options).then((change) => {
    // ... everything else is normal
});

db.get(/* item id */).then((item) => {
    return item.getReadable(options).then((readable) => {
        // ... everything else is normal
    });
});

db.get(/* item id */).then((item) => {
    return item.getWritable(options).then((writable) => {
        // ... everything else is normal
    });
});
```

## Encryption Algorithm

giantdb-crypto uses 192-bit AES with a per-item random initialization vector
by default. The cipher is provided by Node's native `crypto` module, which in
turn uses OpenSSL.
