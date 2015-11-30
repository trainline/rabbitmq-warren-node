# warren

[![Build Status](https://travis-ci.org/trainline/RabbitMQ-Warren-Node.svg?branch=master)](https://travis-ci.org/trainline/RabbitMQ-Warren-Node)
[![Coverage Status](https://coveralls.io/repos/trainline/RabbitMQ-Warren-Node/badge.svg?branch=master&service=github)](https://coveralls.io/github/trainline/RabbitMQ-Warren-Node?branch=master)

## A warren is a shared-nothing RabbitMQ cluster

The original warren pattern uses a load balancer stuck in front of the Rabbit instances (active-passive). This module implements a variation of that pattern but does away with the load balancer and is **active-active**.

## Single publish - multiple listen

A publisher can publish to any instance and a consumer listens to all instances. This approach improves availability of a broker to do work against, it's effectively active-active but does not replicate messages as found with the Shovel/Federation/Mirrored queue features.  

## Caveats

If you use non-persistent messages with this pattern, message loss is still possible - in that case you're better off with publishing to multiple brokers at the same time (unsupported).  When using persistent messages, catastrophic broker failure will still cause message loss. Use where appropriate.


## tl;dr

This module:
  * takes care of connecting to multiple brokers (and retries connecting on failures)
  * subscribes to messages on all brokers (and recovers from errors, subscribes on newly connected brokers)
  * publishes messages to a single broker (and tries other brokers if failed)

## Installation

As usual, with npm:

```bash
$ npm install --save warren
```

## Usage

Having a set of Rascal configurations, create a warren:

```js
const createWarren = require('warren');

const options = {
  hosts: [
    // multiple rascal connection configs
  ],
  brokerConfig: {
    // rascal config with exchange, queue, etc definitions
  }
}

createWarren(options, (err, warren) => {
  warren.on('error', error => {
    // handle errors
  }
  warren.subscribe('messages', (message, content) => {
    // message received
  });
  warren.publish('messages', message, { timeout: 100 }, err => {
    // message published
  });
}).on('error', error => console.log(error));
```


## API

### createWarren(brokerConfigs, [options,] callback)

Creates a warren by creating rascal brokers from the passed in configurations. You can specify some global options (timeouts, retries) or e.g. how many brokers to wait to connect to initially.

**Arguments**
* **options**: configuration Object with properties below
    * **hosts**: array of rascal connection objects
    * **brokerConfig**: rascal config (exchange, queue definitions, etc) to be used for all broker hosts
    * **minBrokersAvailable**: the minimum number of brokers to connect to before calling back (default: 1)
    * **timeout**: timeout in milliseconds for broker creation and publish operations (default: 5000)
    * **tries**: number of publish retries (default: number of broker configs)  
* **callback(err, warren)**: called once warren is ready or an error occurs

**Example**

```js
createWarren(options, (err, warren) => {
  // ...
});
```

### warren.publish(publication, message, options, callback(err))

Publishes a message by trying available brokers until it succeeds (or number of tries exhausted or it times out).

**Arguments**

* **publication**: publication name to use (from your rascal config)
* **message**: message body
* **options**: configuration Object overriding global warren and rascal publish configuration
    * **timeout**: overall timeout in milliseconds for publish completion (default: 5000)
    * **tries**: number of publish retries (default: number of broker configs)
    * *****: rascal specific overrides
* **callback(err)**: called once publish succeeded or an error occurs

**Example**

```js
warren.publish(publication, message, options, err => {
  // ...
});
```

### warren.subscribe(subscription, onMessage)

**Arguments**

* **subscription**: subscription name to use (from your rascal config)
* **message**: message body
* **onMessage(message, content, ackOrNack)**: called when a message is received, follows [rascal conventions](https://github.com/guidesmiths/rascal#subscriptions)
    * **message**: raw message object
    * **content**: parsed message content
    * **ackOrNack**: acknowledgement callback for not auto-acknowledged subscriptions

**Example**

```js
warren.subscribe(subscription, (message, content, ackOrNack) => {
  // ...
});
```

## License

Copyright 2015 Trainline.com Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
