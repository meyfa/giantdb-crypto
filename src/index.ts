import crypto, { CipherKey } from 'crypto'
import { Readable, Writable } from 'stream'
import { Middleware, MiddlewareNextFn } from 'giantdb'

/**
 * Subset of options as required by this middleware.
 */
export interface EncryptionOptions {
  encryption: {
    key: CipherKey
  }
}

/**
 * Determine if the given thing can be indexed like a string-keyed record.
 *
 * @param thing The thing to test.
 * @returns Whether the given thing is a record.
 */
function isRecord (thing: unknown): thing is Record<string, unknown> {
  return thing != null && typeof thing === 'object'
}

/**
 * Determine if the given thing looks like valid encryption options.
 *
 * @param options The potential options.
 * @returns Whether the parameter contains expected encryption options.
 */
function isEncryptionOptions (options: unknown): options is EncryptionOptions {
  return isRecord(options) && isRecord(options.encryption) && options.encryption.key != null
}

/**
 * Given a previous metadata object, store an IV value on it (or create a new object if needed).
 *
 * @param metadata The previous metadata.
 * @param iv The value to store.
 * @returns The resulting metadata object (may be a new instance, or may be the modified parameter).
 */
function storeIV (metadata: unknown, iv: Buffer): object {
  const str = iv.toString('base64')
  const meta = isRecord(metadata) ? metadata : {}
  if (isRecord(meta.encryption)) {
    meta.encryption.iv = str
  } else {
    meta.encryption = { iv: str }
  }
  return meta
}

/**
 * Try to retrieve an IV value from the given item metadata.
 * If IV not found, this will return undefined.
 *
 * @param metadata The metadata.
 * @returns Undefined if IV invalid, otherwise the IV buffer.
 */
function retrieveIV (metadata: unknown): Buffer | undefined {
  if (!isRecord(metadata) || !isRecord(metadata.encryption) || typeof metadata.encryption.iv !== 'string') {
    return undefined
  }
  return Buffer.from(metadata.encryption.iv, 'base64')
}

/**
 * The crypto middleware class. Instantiate this class and use it on a GiantDB store.
 */
export class GiantDBCrypto implements Middleware {
  /**
   * Transforms the given readable stream, putting a decryption layer in between.
   * next is called with the modified state.
   *
   * @param stream The base Readable Stream.
   * @param meta The item metadata.
   * @param options The user-provided options object.
   * @param next The continuation callback.
   */
  transformReadable (stream: Readable, meta: object, options: object | undefined | null, next: MiddlewareNextFn<Readable>): void {
    // can only decrypt if options are specified correctly, and metadata is complete
    if (!isEncryptionOptions(options)) {
      next(new Error('missing or invalid encryption options, key not found during item read'))
      return
    }

    // get key from options and initialization vector from item's metadata
    const key = options.encryption.key
    const iv = retrieveIV(meta)
    if (iv == null) {
      next(new Error('unable to retrieve encryption metadata for item'))
      return
    }

    const decipher = crypto.createDecipheriv('aes192', key, iv)
    stream.pipe(decipher)

    next(undefined, {
      stream: decipher
    })
  }

  /**
   * Transforms the given writable stream, putting an encryption layer in between.
   * next is called with the modified state.
   *
   * @param stream The base Writable Stream.
   * @param meta The item metadata.
   * @param options The user-provided options object.
   * @param next The continuation callback.
   */
  transformWritable (stream: Writable, meta: object, options: object | undefined | null, next: MiddlewareNextFn<Writable>): void {
    if (!isEncryptionOptions(options)) {
      next(new Error('missing or invalid encryption options, key not found during item write'))
      return
    }

    // get key from options and generate new initialization vector for this item
    const key = options.encryption.key
    const iv = crypto.randomBytes(16)

    const newMeta = storeIV(meta, iv)
    const cipher = crypto.createCipheriv('aes192', key, iv)
    cipher.pipe(stream)

    next(undefined, {
      metadata: newMeta,
      stream: cipher
    })
  }
}
