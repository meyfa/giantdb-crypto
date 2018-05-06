"use strict";

const crypto = require("crypto");

module.exports = Crypto;

/**
 * Constructs a new middleware instance.
 *
 * @constructor
 */
function Crypto() {
    if (!(this instanceof Crypto)) {
        return new Crypto();
    }
}

/**
 * Transforms the given readable stream, putting a decryption layer in between.
 * next is called with the modified state.
 *
 * @param {stream.Readable} stream The base Readable.
 * @param {Object} meta The item metadata.
 * @param {Object} options The user-provided options object.
 * @param {Function} next The continuation callback.
 * @return {void}
 */
Crypto.prototype.transformReadable = function (stream, meta, options, next) {
    // get initialization vector from metadata
    const iv = Buffer.from(meta.encryption.iv, "base64");
    // get key from options
    const key = options.encryption.key;

    const decipher = crypto.createDecipheriv("aes192", key, iv);
    stream.pipe(decipher);

    next(null, {
        stream: decipher,
    });
};

/**
 * Transforms the given writable stream, putting an encryption layer in between.
 * next is called with the modified state.
 *
 * @param {stream.Writable} stream The base Writable.
 * @param {Object} meta The item metadata.
 * @param {Object} options The user-provided options object.
 * @param {Function} next The continuation callback.
 * @return {void}
 */
Crypto.prototype.transformWritable = function (stream, meta, options, next) {
    // generate new initialization vector
    const iv = crypto.randomBytes(16);
    // get key from options
    const key = options.encryption.key;

    // store iv in metadata
    meta.encryption = meta.encryption || {};
    meta.encryption.iv = iv.toString("base64");

    const cipher = crypto.createCipheriv("aes192", key, iv);
    cipher.pipe(stream);

    next(null, {
        metadata: meta,
        stream: cipher,
    });
};
