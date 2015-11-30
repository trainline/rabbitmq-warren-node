// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const Code = require('code');
const expect = Code.expect;
const proxyquire = require('proxyquire');
const clone = require('lodash.clone');

const createBroker = require('./mock/broker-create');
const createWarren = proxyquire('../', { 'broker-create': createBroker });
const warrenOptions = require('./utils').warrenOptions;

const options = {};

describe('warren publish (failure tests)', () => {
  it('handles disconnected brokers', done => {
    const warrenOpts = warrenOptions({count: 2});
    createWarren(warrenOpts, (err, warren) => {
      const brokers = clone(warren.brokers);
      brokers.forEach(broker => {
        broker.emit('disconnect');
        broker.emit('disconnect');
      });
      warren.publish('channel', 'message', options, error => {
        expect(error).to.be.object();
        expect(error.message).to.equal('no broker');
        done();
      });
    });
  });

  it('handles blocked brokers', done => {
    const warrenOpts = warrenOptions({count: 2});
    createWarren(warrenOpts, (err, warren) => {
      const brokers = clone(warren.brokers);
      brokers.forEach(broker => {
        broker.emit('blocked');
      });
      warren.publish('channel', 'message', options, error => {
        expect(error).to.be.object();
        expect(error.message).to.equal('no broker');
        done();
      });
    });
  });

  it('handles broker reconnects', done => {
    const warrenOpts = warrenOptions({count: 2});
    createWarren(warrenOpts, (error, warren) => {
      const brokers = clone(warren.brokers);
      brokers.forEach(broker => {
        broker.emit('disconnect');
      });
      brokers.forEach(broker => {
        broker.emit('connect');
        broker.emit('connect');
      });
      warren.publish('channel', 'message', options, err => {
        expect(err).to.be.undefined();
        expect(brokers.filter(broker => {
          return broker.sentOnlyOne('channel', 'message');
        }).length).to.equal(1);
        done();
      });
    });
  });

  it('handles balancer unblock', done => {
    const warrenOpts = warrenOptions({count: 2});
    createWarren(warrenOpts, (err, warren) => {
      const brokers = clone(warren.brokers);
      brokers.forEach(broker => {
        broker.emit('disconnect');
      });
      brokers.forEach(broker => {
        broker.emit('unblocked');
      });
      warren.publish('channel', 'message', options, error => {
        expect(error).to.be.undefined();
        expect(brokers.filter(broker => {
          return broker.sentOnlyOne('channel', 'message');
        }).length).to.equal(1);
        done();
      });
    });
  });

  it('emits error if broker emits error', done => {
    const warrenOpts = warrenOptions({count: 2});
    createWarren(warrenOpts, (err, warren) => {
      warren.once('error', error => {
        expect(error).to.be.object();
        expect(error.message).to.equal('oops');
        done();
      });
      warren.brokers[0].emit('error', new Error('oops'));
    });
  });

  it('waits a bit', done => {
    setTimeout(done, 1000);
  });
});
