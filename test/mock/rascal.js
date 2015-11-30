// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const timers = require('timers');
const isEqual = require('lodash.isequal');
const EventEmitter = require('events');
const defaults = require('lodash.defaults');

exports.createBroker = createBroker;

let failOnCreateOnce = true;

function createBroker(opts, callback) {
  const globalOpts = opts.vhosts['/'].connection;
  const broker = new EventEmitter();
  const globalOptions = defaults({}, globalOpts);
  const channels = {};
  const sentMessages = [];
  broker.publish = publish;
  broker.subscribe = subscribe;
  broker.bounce = bounce;
  broker.shutdown = shutdown;

  broker.message = brokerMessage;
  broker.sentCount = sentCount;
  broker.sentOnlyOne = sentOnlyOne;
  broker.changeGlobalOption = changeGlobalOption;
  broker.failureCount = 0;
  broker.down = false;

  if (globalOptions.failOnCreate) {
    return callback('some error');
  }

  if (globalOptions.failOnCreateOnce && failOnCreateOnce) {
    failOnCreateOnce = false;
    return callback('some error');
  }
  failOnCreateOnce = true;
  callback(null, broker);


  function publish(channel, message, options, cb) {
    if (globalOptions.failOnPublish) {
      return fail('some error', cb);
    }
    timers.setTimeout(() => {
      const publication = new EventEmitter();
      timers.setTimeout(() => {
        if (globalOptions.failOnPublishing) {
          broker.failureCount ++;
          publication.emit('error', new Error('publication failed'));
        } else if (globalOptions.returnMessage) {
          broker.failureCount ++;
          publication.emit('return', message);
        } else {
          sentMessages.push([channel, message]);
          publication.emit('success');
        }
      }, globalOptions.lag || 0);
      cb(null, publication);
    }, globalOptions.publicationLag || 0);
  }

  function subscribe(channel, cb) {
    if (! channels[channel]) {
      channels[channel] = [];
    }
    if (globalOptions.failOnSubscribe) {
      broker.failureCount ++;
      timers.setImmediate(cb, new Error('subscribe failed'));
    } else {
      const subscription = new EventEmitter();
      channels[channel].push(subscription);
      timers.setImmediate(cb, null, subscription);

      if (globalOptions.failSubscriptionAfter) {
        timers.setTimeout(() => {
          const idx = channels[channel].indexOf(subscription);
          if (idx >= 0) {
            channels[channel].splice(idx, 1);
          }
          subscription.emit('error', new Error('subscription error'));
        }, globalOptions.failSubscriptionAfter);
      }
    }
  }

  function bounce(cb) {
    timers.setImmediate(() => {
      broker.emit('disconnect');
      timers.setImmediate(() => {
        broker.emit('connect');
        timers.setImmediate(cb);
      });
    });
  }

  function brokerMessage(channel, message) {
    const subscriptions = channels[channel];
    if (subscriptions) {
      subscriptions.forEach((subscription) => {
        timers.setImmediate(() => {
          subscription.emit('message', message);
        });
      });
    }
  }

  function sentCount(channel, message) {
    return sentMessages.filter(match).length;

    function match(sentMessage) {
      return isEqual(sentMessage, [channel, message]);
    }
  }

  function sentOnlyOne(channel, message) {
    return sentCount(channel, message) === 1;
  }

  function changeGlobalOption(key, val) {
    globalOptions[key] = val;
  }

  function fail(err, cb) {
    broker.failureCount ++;
    cb(new Error(err));
  }

  function shutdown(cb) {
    broker.down = true;
    cb();
  }
}
