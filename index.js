'use strict'

const crypto = require('crypto')

class Crypto {
  /**
   * Transforms the given readable stream, putting a decryption layer in between.
   * next is called with the modified state.
   *
   * @param {object} stream The base Readable Stream.
   * @param {object} meta The item metadata.
   * @param {object} options The user-provided options object.
   * @param {Function} next The continuation callback.
   * @returns {void}
   */
  transformReadable (stream, meta, options, next) {
    // get initialization vector from metadata
    const iv = Buffer.from(meta.encryption.iv, 'base64')
    // get key from options
    const key = options.encryption.key

    const decipher = crypto.createDecipheriv('aes192', key, iv)
    stream.pipe(decipher)

    next(null, {
      stream: decipher
    })
  }

  /**
   * Transforms the given writable stream, putting an encryption layer in between.
   * next is called with the modified state.
   *
   * @param {object} stream The base Writable Stream.
   * @param {object} meta The item metadata.
   * @param {object} options The user-provided options object.
   * @param {Function} next The continuation callback.
   * @returns {void}
   */
  transformWritable (stream, meta, options, next) {
    // generate new initialization vector
    const iv = crypto.randomBytes(16)
    // get key from options
    const key = options.encryption.key

    // store iv in metadata
    meta.encryption = meta.encryption || {}
    meta.encryption.iv = iv.toString('base64')

    const cipher = crypto.createCipheriv('aes192', key, iv)
    cipher.pipe(stream)

    next(null, {
      metadata: meta,
      stream: cipher
    })
  }
}

module.exports = Crypto
