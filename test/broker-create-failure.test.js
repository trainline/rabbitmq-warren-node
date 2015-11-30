// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const Code = require('code');
const expect = Code.expect;
const EventEmitter = require('events');
const proxyquire = require('proxyquire');

const createBroker = proxyquire('../lib/broker-create', { rascal: require('./mock/rascal') });
const warren = new EventEmitter();
const createBrokerOptions = require('./utils').createBrokerOptions;

warren.on('error', () => {});

describe('warren broker creation (failure tests)', () => {
  it('calls back with error', done => {
    createBroker(warren, createBrokerOptions({ failOnCreate: true }), err => {
      expect(err).to.equal('some error');
      done();
    });
  });

  it('calls back with error when norecover', done => {
    createBroker(warren, createBrokerOptions({ failOnCreate: true }), err => {
      expect(err).to.equal('some error');
      done();
    }, true);
  });

  it('calls back with broker if recovered', done => {
    warren.on('created', broker => {
      expect(broker).to.exist();
      done();
    });
    createBroker(warren, createBrokerOptions({ failOnCreateOnce: true }), err => {
      expect(err).to.equal('some error');
    });
  });

  it('waits a bit', done => {
    setTimeout(done, 1000);
  });
});
