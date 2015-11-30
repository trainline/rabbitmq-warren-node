// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const Code = require('code');
const expect = Code.expect;
const proxyquire = require('proxyquire');

const createBroker = require('./mock/broker-create');
const createWarren = proxyquire('../', { 'broker-create': createBroker });
const warrenOptions = require('./utils').warrenOptions;

describe('warren init', () => {
  it('errors if you have less hosts than minBrokersAvailable', done => {
    createWarren(warrenOptions({hosts: [{count: 2}], minBrokersAvailable: 4}), err => {
      expect(err.message).to.exist();
      expect(err.message).to.equal('not enough hosts');
      done();
    });
  });

  it('doesn\'t wait for broker creation if asked not to', done => {
    createWarren(warrenOptions({ hosts: [{count: 4}], minBrokersAvailable: 0 }), (err, warren) => {
      expect(err).to.be.null();
      expect(warren).to.exist();
      done();
    });
  });

  it('errors if can\`t connect to required number of brokers before timeout', done => {
    createWarren(warrenOptions({ hosts: [{ failOnCreate: true }], minBrokersAvailable: 1, timeout: 100, tries: 1 }), err => {
      expect(err).to.exist();
      expect(err.message).to.equal('Timed out while connecting to 1 brokers in 100ms');
      done();
    }).on('error', () => {});
  });
});
