// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const Code = require('code');
const expect = Code.expect;
const proxyquire = require('proxyquire');

const createBroker = require('./mock/broker-create');
const createWarren = proxyquire('../', { 'broker-create': createBroker });
const warrenOptions = require('./utils').warrenOptions;

describe('shutdown', () => {
  it('calls shutdown on all brokers', (done) => {
    createWarren(warrenOptions(), (error, warren) => {
      warren.shutdown(err => {
        expect(err).to.be.null();
        expect(warren.brokers.map(broker => broker.down)).to.deep.equal(
          [true, true, true, true]
        );
        done();
      });
    });
  });
});
