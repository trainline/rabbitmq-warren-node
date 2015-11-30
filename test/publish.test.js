// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const Code = require('code');
const expect = Code.expect;
const defaults = require('lodash.defaults');
const proxyquire = require('proxyquire');

const createBroker = require('./mock/broker-create');
const createWarren = proxyquire('../', { 'broker-create': createBroker });
const warrenOptions = require('./utils').warrenOptions;

const publishOptions = {};

describe('warren publish', () => {
  it('works if no broker errors', done => {
    createWarren(warrenOptions(), (error, warren) => {
      warren.publish('channel', 'message', publishOptions, err => {
        expect(err).to.be.undefined();
        expect(warren.brokers.filter(broker => {
          return broker.sentOnlyOne('channel', 'message');
        }).length).to.equal(1);
        done();
      });
    });
  });

  it('fails if every broker publish fails', done => {
    createWarren(warrenOptions({failOnPublish: true}), (error, warren) => {
      warren.publish('channel', 'message', publishOptions, err => {
        expect(err).to.be.object();
        expect(err.message).to.equal('some error');
        expect(warren.brokers.every(broker => {
          return broker.failureCount === 1;
        })).to.equal(true);
        done();
      });
    });
  });

  it('succeeds if one broker publish succeeds', done => {
    const options = warrenOptions({hosts: [{ failOnPublish: true, count: 3 }, { count: 1 }]});
    createWarren(options, (error, warren) => {
      warren.publish('channel', 'message', publishOptions, err => {
        expect(err).to.be.undefined();
        expect(warren.brokers.filter(broker => {
          return broker.sentOnlyOne('channel', 'message');
        }).length).to.equal(1);
        done();
      });
    });
  });

  it('fails if every broker publishing fails', done => {
    createWarren(warrenOptions({failOnPublishing: true}), (error, warren) => {
      warren.publish('channel', 'message', publishOptions, err => {
        expect(err).to.be.object();
        expect(err.message).to.equal('publication failed');
        expect(warren.brokers.every(broker => {
          return broker.failureCount === 1;
        })).to.equal(true);
        done();
      });
    });
  });

  it('fails if every broker returns message', done => {
    createWarren(warrenOptions({returnMessage: true}), (error, warren) => {
      warren.publish('channel', 'message', publishOptions, err => {
        expect(err).to.be.object();
        expect(err.message).to.equal('message was returned');
        expect(warren.brokers.every(broker => {
          return broker.failureCount === 1;
        })).to.equal(true);

        done();
      });
    });
  });

  it('fails if one broker and exceeds timeout', done => {
    const opts = defaults({ timeout: 100, tries: 2 }, publishOptions);
    createWarren(warrenOptions({lag: 200, count: 1}), (error, warren) => {
      warren.publish('channel', 'message', opts, err => {
        expect(err).to.be.object();
        expect(err.message).to.equal('publish timed out after 100 ms');
        done();
      });
    });
  });

  it('fails if exceeds timeout', done => {
    const opts = defaults({ timeout: 100 }, publishOptions);
    createWarren(warrenOptions({lag: 200}), (error, warren) => {
      warren.publish('channel', 'message', opts, err => {
        expect(err).to.be.object();
        expect(err.message).to.equal('publish timed out after 100 ms');
        done();
      });
    });
  });

  it('fails if exceeds overall timeout', done => {
    const opts = defaults({ timeout: 300, tries: 100 }, publishOptions);
    createWarren(warrenOptions({lag: 100, failOnPublishing: true}), (error, warren) => {
      warren.publish('channel', 'message', opts, err => {
        expect(err).to.be.object();
        expect(err.message).to.equal('publish timed out after 300 ms');
        done();
      });
    });
  });

  it('fails if exceeds overall timeout 2', done => {
    const opts = defaults({ timeout: 300, tries: 100 }, publishOptions);
    createWarren(warrenOptions({publicationLag: 100, failOnPublishing: true}), (error, warren) => {
      warren.publish('channel', 'message', opts, err => {
        expect(err).to.be.object();
        expect(err.message).to.equal('publish timed out after 300 ms');
        done();
      });
    });
  });

  it('succeeds if does not exceed timeout', done => {
    const opts = defaults({ timeout: 300 }, publishOptions);
    createWarren(warrenOptions({lag: 100, count: 2}), (error, warren) => {
      warren.publish('channel', 'message', opts, err => {
        expect(err).to.be.undefined();
        expect(warren.brokers.filter(broker => {
          return broker.sentOnlyOne('channel', 'message');
        }).length).to.equal(1);
        done();
      });
    });
  });

  it('fails but doesnt retry if tries is 1', done => {
    const opts = defaults({ tries: 1 }, publishOptions);
    createWarren(warrenOptions({failOnPublish: true}), (error, warren) => {
      warren.publish('channel', 'message', opts, err => {
        expect(err).to.be.object();
        expect(err.message).to.equal('some error');
        expect(warren.brokers.filter(broker => {
          return broker.failureCount >= 1;
        }).length).to.equal(1);
        done();
      });
    });
  });

  it('waits a bit', done => {
    setTimeout(done, 1000);
  });
});
