// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const debug = require('debug')('warren:createBroker');
const rascal = require('rascal');
const Backoff = require('backoff');

module.exports = function createBroker(warren, brokerConfig, cb, noRecover) {
  let callback = cb;
  if (!callback) {
    callback = onError;
  }
  rascal.createBroker(brokerConfig, (err, broker) => {
    if (!err) {
      debug('successfully created broker');
      warren.emit('created', broker);
    } else {
      debug('error creating broker', err);
      recover();
      onError(err);
    }
    callback(err);
  });

  function recover() {
    if (noRecover) return;
    debug('recovering broker creation');
    const backoff = Backoff.exponential();
    backoff.on('ready', () => {
      debug('backoff ready, trying to recreate broker');
      createBroker(warren, brokerConfig, onceBrokerCreated, true);
    });

    backoff.backoff();

    function onceBrokerCreated(err) {
      if (err) {
        debug('broker recreation failed, backing off');
        backoff.backoff();
      } else {
        debug('broker recreation succeeded');
      }
    }
  }

  function onError(err) {
    if (err) {
      warren.emit('error', err);
    }
  }
};
