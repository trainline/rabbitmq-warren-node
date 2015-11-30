// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const debug = require('debug')('warren:broker-events');

module.exports = function listenToBrokerEvents(broker, availableBrokers, onError) {
  broker.on('error', onError);

  ['blocked', 'disconnect'].forEach(event => {
    broker.on(event, () => {
      debug('broker %s', event);
      const brokerIndex = availableBrokers.indexOf(broker);
      if (brokerIndex >= 0) {
        availableBrokers.splice(brokerIndex, 1);
      }
    });
  });

  broker.on('blocked', () => broker.bounce(onError));

  ['unblocked', 'connect'].forEach(event => {
    broker.on(event, () => {
      debug('broker %s', event);
      const brokerIndex = availableBrokers.indexOf(broker);
      if (brokerIndex === -1) {
        availableBrokers.push(broker);
      }
    });
  });
};
