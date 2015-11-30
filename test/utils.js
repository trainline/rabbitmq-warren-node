// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const get = require('lodash.get');
const times = require('lodash.times');
const forEach = require('lodash.foreach');
const merge = require('lodash.merge');
const omit = require('lodash.omit');

const defaultBrokerCount = 4;

exports.createBrokerConfigs = function createBrokerConfigs(options) {
  const count = options && options.count || defaultBrokerCount;
  const configs = [];
  for (let i = 0; i < count; i ++) {
    configs.push(options);
  }
  return configs;
};

exports.warrenOptions = (options) => {
  const hosts = [];
  if (options && !options.hosts) options.hosts = [options];
  forEach(get(options, 'hosts') || [{}], host => {
    times(host.count || defaultBrokerCount, () => hosts.push(omit(host, 'count')));
  });
  return merge({
    hosts: hosts,
    brokerConfig: { vhosts: { '/': {} } },
    minBrokersAvailable: get(options, 'minBrokersAvailable') || hosts.length,
  }, options);
};

exports.createBrokerOptions = options => ({ vhosts: { '/': { connection: options } } });
