// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const timers = require('timers');

const defaults = require('lodash.defaults');
const shuffle = require('lodash.shuffle');
const once = require('lodash.once');
const debug = require('debug')('warren:publish');

function publish(exchange, message, options, cb) {
  let timedout = false;
  debug('publish', exchange, message, options);

  function onTimeout() {
    debug('timed out');
    timedout = true;
    cb(new Error('publish timed out after ' + options.timeout + ' ms'));
  }

  options.tries --;
  if (options.tries < 0) {
    debug('max tries exceeded, giving up');
    return cb(options.lastError);
  }

  const broker = options.brokers[options.brokerIndex];
  options.brokerIndex = ++options.brokerIndex % options.brokers.length;
  if (! broker) {
    return cb(new Error('no broker'));
  }

  const timeout = timers.setTimeout(onTimeout, options.expiresAt - Date.now());
  timeout.unref();

  broker.publish(exchange, message, options, onPublication);

  function onPublication(err, publication) {
    debug('onPublication');
    if (err) {
      onError(err);
    } else {
      publication
        .once('error', onError)
        .once('return', onReturn)
        .once('success', onSuccess);
    }
  }

  function retry() {
    debug('retry');
    if (timedout) {
      cb(options.lastError);
    } else {
      timers.clearTimeout(timeout);
      publish(exchange, message, options, cb);
    }
  }

  function onSuccess() {
    debug('onSuccess');
    timers.clearTimeout(timeout);
    cb();
  }

  function onError(err) {
    debug('onError', err);
    options.lastError = err;
    retry();
  }

  function onReturn() {
    debug('onReturn');
    onError(new Error('message was returned'));
  }
}

module.exports = (brokers, globalOptions, exchange, message, opts, _cb) => {
  debug('publish', exchange, message, opts);
  const cb = once(_cb);
  const options = defaults({
    brokers: shuffle(brokers),
    brokerIndex: 0,
  }, opts, globalOptions);
  options.expiresAt = Date.now() + options.timeout;
  publish(exchange, message, options, cb);
};
