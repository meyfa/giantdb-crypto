import assert from 'node:assert'
import { PassThrough } from 'node:stream'
import { GiantDBCrypto } from '../src/index.js'
import { GiantDB } from 'giantdb'

describe('index.ts', function () {
  it('can be installed as middleware on GiantDB', function () {
    const db = new GiantDB()
    db.use(new GiantDBCrypto())
  })

  describe('#transformReadable()', function () {
    it('calls next() with a new stream', function (done) {
      const stream = new PassThrough()
      const meta = {
        encryption: {
          iv: Buffer.alloc(16).toString('base64')
        }
      }
      const options = {
        encryption: {
          key: Buffer.alloc(24)
        }
      }
      const next = (err?: any, result?: any): void => {
        assert.strictEqual(err, undefined)
        assert.ok(typeof result === 'object')
        assert.ok(typeof result?.stream?.pipe === 'function')
        done()
      }
      const obj = new GiantDBCrypto()
      obj.transformReadable(stream, meta, options, next)
    })

    it('fails for missing IV', function (done) {
      const stream = new PassThrough()
      const meta = {}
      const options = {
        encryption: {
          key: Buffer.alloc(24)
        }
      }
      const next = (err?: any): void => {
        assert.ok(err instanceof Error)
        done()
      }
      const obj = new GiantDBCrypto()
      obj.transformReadable(stream, meta, options, next)
    })

    it('fails for missing key', function (done) {
      const stream = new PassThrough()
      const meta = {
        encryption: {
          iv: Buffer.alloc(16).toString('base64')
        }
      }
      const options = {}
      const next = (err?: any): void => {
        assert.ok(err instanceof Error)
        done()
      }
      const obj = new GiantDBCrypto()
      obj.transformReadable(stream, meta, options, next)
    })
  })

  describe('#transformWritable()', function () {
    it('calls next() with a new stream', function (done) {
      const stream = new PassThrough()
      const meta = {
        encryption: {
          iv: Buffer.alloc(16).toString('base64')
        }
      }
      const options = {
        encryption: {
          key: Buffer.alloc(24)
        }
      }
      const next = (err?: any, result?: any): void => {
        assert.strictEqual(err, undefined)
        assert.ok(typeof result === 'object')
        assert.ok(typeof result?.stream?.write === 'function')
        done()
      }
      const obj = new GiantDBCrypto()
      obj.transformWritable(stream, meta, options, next)
    })

    it('generates a new IV', function (done) {
      const stream = new PassThrough()
      const meta = {}
      const options = {
        encryption: {
          key: Buffer.alloc(24)
        }
      }
      const next = (err?: any, result?: any): void => {
        assert.strictEqual(err, undefined)
        assert.ok(typeof result === 'object')
        assert.ok(typeof result?.metadata?.encryption?.iv === 'string')
        done()
      }
      const obj = new GiantDBCrypto()
      obj.transformWritable(stream, meta, options, next)
    })

    it('fails for missing key', function (done) {
      const stream = new PassThrough()
      const meta = {
        encryption: {
          iv: Buffer.alloc(16).toString('base64')
        }
      }
      const options = {}
      const next = (err?: any): void => {
        assert.ok(err instanceof Error)
        done()
      }
      const obj = new GiantDBCrypto()
      obj.transformWritable(stream, meta, options, next)
    })
  })
})
