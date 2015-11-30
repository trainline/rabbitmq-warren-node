// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const util = require('util');
const async = require('async');
const debug = require('debug')('warren:init');
const timers = require('timers');
const defaults = require('lodash.defaults');
const once = require('lodash.once');
const cloneDeep = require('lodash.clonedeep');
const map = require('lodash.map');
const EventEmitter = require('events');
const rascal = require('rascal');

const createBroker = require('./lib/broker-create');
const subscribeBroker = require('./lib/broker-subscribe');
const listenToBrokerEvents = require('./lib/broker-events');
const publish = require('./lib/publish');

const defaultOptions = {
  timeout: 5000,
  minBrokersAvailable: 1,
};

const hostsToBrokerConfig = (config, host) => {
  const amqpConfig = cloneDeep(config);
  amqpConfig.vhosts['/'].connection = host;
  return rascal.withDefaultConfig(amqpConfig);
};

module.exports = function createWarren(opts, _callback) {
  const callback = once(_callback);
  const options = defaults({}, opts, defaultOptions);
  const brokerConfigs = map(options.hosts, hostsToBrokerConfig.bind(null, options.brokerConfig));

  if (!brokerConfigs || brokerConfigs.length < options.minBrokersAvailable) {
    return callback(new Error('not enough hosts'));
  }
  if (!options.tries) {
    options.tries = brokerConfigs.length;
  }
  debug('global options:', options);

  const subscriptions = {};
  const availableBrokers = [];
  const brokers = [];

  const warren = new EventEmitter();
  warren.publish = publish.bind(null, availableBrokers, options);
  warren.subscribe = subscribe;
  warren.brokers = availableBrokers;
  warren.shutdown = (cb) => {
    async.each(brokers, (broker, done) => broker.shutdown(done), cb);
  };

  debug('creating %d brokers', brokerConfigs.length);
  warren.on('created', onBrokerCreated);
  let timeout;
  if (options.minBrokersAvailable > 0) {
    timeout = timers.setTimeout(callback, options.timeout, timeoutError(options));
    timeout.unref();
  } else {
    callback(null, warren);
  }
  brokerConfigs.forEach(config => timers.setImmediate(createBroker, warren, config));
  return warren;

  // Public methods

  function subscribe(channel, onMessage) {
    subscriptions[channel] = onMessage;
    debug('subscribing to channel %s', channel);
    availableBrokers.forEach(broker => subscribeBroker(warren, broker, channel, onMessage));
  }

  // Private methods

  function timeoutError() {
    return new Error(util.format('Timed out while connecting to %d brokers in %dms',
      options.minBrokersAvailable,
      options.timeout));
  }

  function onBrokerCreated(broker) {
    brokers.push(broker);
    listenToBrokerEvents(broker, availableBrokers, onError);

    Object.keys(subscriptions).forEach(channel => {
      const onMessage = subscriptions[channel];
      subscribeBroker(warren, broker, channel, onMessage);
    });

    broker.emit('connect');

    const minBrokersAvailable = options.minBrokersAvailable;
    if (minBrokersAvailable > 0 && availableBrokers.length === minBrokersAvailable) {
      timers.clearTimeout(timeout);
      callback(null, warren);
    }
  }

  function onError(err) {
    if (err) {
      warren.emit('error', err);
    }
  }
};
