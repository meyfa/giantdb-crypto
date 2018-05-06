"use strict";

const chai = require("chai");
const expect = chai.expect;

const PassThrough = require("stream").PassThrough;

const Crypto = require("../index.js");

describe("index.js", function () {

    describe("#transformReadable()", function () {

        it("calls next() with a new stream", function (done) {
            const stream = new PassThrough();
            const meta = {
                encryption: {
                    iv: Buffer.alloc(16).toString("base64"),
                },
            };
            const options = {
                encryption: {
                    key: Buffer.alloc(24),
                },
            };

            function next(result) {
                expect(result).to.be.an("object");
                expect(result).to.have.property("stream")
                    .that.has.property("pipe").that.is.a("function");

                done();
            }

            const obj = new Crypto();
            obj.transformReadable(stream, meta, options, next);
        });

        it("fails for missing IV", function () {
            const stream = new PassThrough();
            const meta = {};
            const options = {
                encryption: {
                    key: Buffer.alloc(24),
                },
            };

            const obj = new Crypto();
            expect(() => obj.transformReadable(stream, meta, options, () => {}))
                .to.throw;
        });

        it("fails for missing key", function () {
            const stream = new PassThrough();
            const meta = {
                encryption: {
                    iv: Buffer.alloc(16).toString("base64"),
                },
            };
            const options = {};

            const obj = new Crypto();
            expect(() => obj.transformReadable(stream, meta, options, () => {}))
                .to.throw;
        });

    });

    describe("#transformWritable()", function () {

        it("calls next() with a new stream", function (done) {
            const stream = new PassThrough();
            const meta = {
                encryption: {
                    iv: Buffer.alloc(16).toString("base64"),
                },
            };
            const options = {
                encryption: {
                    key: Buffer.alloc(24),
                },
            };

            function next(result) {
                expect(result).to.be.an("object");
                expect(result).to.have.property("stream")
                    .that.has.property("write").that.is.a("function");

                done();
            }

            const obj = new Crypto();
            obj.transformWritable(stream, meta, options, next);
        });

        it("generates a new IV", function (done) {
            const stream = new PassThrough();
            const meta = {};
            const options = {
                encryption: {
                    key: Buffer.alloc(24),
                },
            };

            function next(result) {
                expect(result).to.be.an("object");
                expect(result).to.have.property("metadata")
                    .that.has.property("encryption").that.is.an("object")
                    .and.has.property("iv").that.is.a("string");

                done();
            }

            const obj = new Crypto();
            obj.transformWritable(stream, meta, options, next);
        });

        it("fails for missing key", function () {
            const stream = new PassThrough();
            const meta = {
                encryption: {
                    iv: Buffer.alloc(16).toString("base64"),
                },
            };
            const options = {};

            const obj = new Crypto();
            expect(() => obj.transformWritable(stream, meta, options, () => {}))
                .to.throw;
        });

    });

});
