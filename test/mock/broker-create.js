// Copyright (c) Trainline.com Limited. All rights reserved. See LICENSE.txt in the project root for license .

'use strict';

const proxyquire = require('proxyquire');

module.exports = proxyquire('../../lib/broker-create', { rascal: require('./rascal') });
