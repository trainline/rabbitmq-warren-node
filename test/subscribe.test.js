// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const Code = require('code');
const expect = Code.expect;
const proxyquire = require('proxyquire');

const createBroker = require('./mock/broker-create');
const createWarren = proxyquire('../', { 'broker-create': createBroker });
const warrenOptions = require('./utils').warrenOptions;

describe('warren subscribe', () => {
  it('works if no broker errors', done => {
    const warrenOpts = warrenOptions();
    createWarren(warrenOpts, (error, warren) => {
      const messages = ['message 1', 'message 2', 'message 3'];
      warren.subscribe('channel', message => {
        expect(message).to.equal(messages.shift());
        if (! messages.length) {
          done();
        }
      });

      messages.forEach((message, index) => {
        warren.brokers[index % warren.brokers.length].message('channel', message);
      });
    });
  });

  it('it doesnt works if all brokers error', done => {
    const warrenOpts = warrenOptions({failOnSubscribe: true});
    createWarren(warrenOpts, (error, warren) => {
      let pendingErrors = warren.brokers.length;
      warren.on('error', err => {
        expect(err).to.be.object();
        expect(err.message).to.equal('subscribe failed');
        pendingErrors--;
        if (! pendingErrors) {
          done();
        }
      });
      warren.subscribe('channel', () => {
        throw new Error('should not reach here');
      });
      warren.brokers[0].message('channel', 'message');
    });
  });

  it('works even if not waiting for all brokers to be created', done => {
    const warrenOpts = warrenOptions({minBrokersAvailable: 1});
    createWarren(warrenOpts, (error, warren) => {
      const messages = ['message 1', 'message 2', 'message 3'];
      warren.subscribe('channel', message => {
        expect(message).to.equal(messages.shift());
        if (! messages.length) {
          done();
        }
      });
      messages.forEach((message, index) => {
        warren.brokers[index % warren.brokers.length].message('channel', message);
      });
    });
  });

  it('waits a bit', done => {
    setTimeout(done, 1000);
  });
});
