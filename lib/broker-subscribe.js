// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const debug = require('debug')('warren:subscribe');
const Backoff = require('backoff');

module.exports = function subscribeBroker(warren, broker, channel, onMessage, cb, noRecover) {
  let callback = cb;
  if (!callback) {
    callback = onError;
  }
  broker.subscribe(channel, (err, subscription) => {
    if (!err) {
      debug('successfully subscribed to channel on one broker');
      subscription.on('message', onMessage);
      subscription.on('error', onError);
      warren.emit('subscribed', channel, broker);
    } else {
      debug('error subscribing to channel on one broker', channel);
      warren.emit('error', err);
      recover();
    }
    callback(err);
  });

  function recover() {
    if (noRecover) return;
    debug('recovering subscription to %s', channel);
    const backoff = Backoff.exponential();
    backoff.on('ready', () => {
      debug('backoff ready, trying to resubscribe to channel', channel);
      subscribeBroker(warren, broker, channel, onMessage, onceBrokerResubscribed, true);
    });

    backoff.backoff();

    function onceBrokerResubscribed(err) {
      if (err) {
        debug('resubscribe failed, backing off');
        backoff.backoff();
      } else {
        debug('resubscribe succeeded');
      }
    }
  }

  function onError(err) {
    if (err) {
      warren.emit('error', err);
    }
  }
};
