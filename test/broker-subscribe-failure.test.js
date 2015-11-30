// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const Code = require('code');
const expect = Code.expect;
const proxyquire = require('proxyquire');

const createBroker = require('./mock/broker-create');
const createWarren = proxyquire('../', { 'broker-create': createBroker });
const warrenOptions = require('./utils').warrenOptions;

describe('warren subscribe (failure tests)', () => {
  it('recovers from failed subscription', done => {
    const warrenOpts = warrenOptions({failOnSubscribe: true, count: 1});
    createWarren(warrenOpts, (err, warren) => {
      warren.on('error', () => {});

      const messages = ['message 1', 'message 2', 'message 3'];

      expect(warren.brokers[0].failureCount).to.equal(0);
      warren.subscribe('channel', message => {
        expect(message).to.equal(messages.shift());
        if (! messages.length) {
          done();
        }
      });
      expect(warren.brokers[0].failureCount).to.equal(1);
      warren.brokers[0].changeGlobalOption('failOnSubscribe', false);

      warren.once('subscribed', () => {
        messages.forEach(message => warren.brokers[0].message('channel', message));
      });
    });
  });

  it('waits a bit', done => {
    setTimeout(done, 1000);
  });
});
