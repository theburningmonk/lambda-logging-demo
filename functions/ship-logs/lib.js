'use strict';

const _          = require('lodash');
const co         = require('co');
const Promise    = require('bluebird');
const parse      = require('./parse');
const cloudwatch = require('./cloudwatch');
const net        = require('net');
const host       = process.env.logstash_host;
const port       = process.env.logstash_port;
const token      = process.env.token;

let sendLogs = co.wrap(function* (logs) {
  yield new Promise((resolve, reject) => {
    let socket = net.connect(port, host, function() {
      socket.setEncoding('utf8');

      for (let log of logs) {
        try {
          log.token = token;
          socket.write(JSON.stringify(log) + '\n');    
        } catch (err) {
          console.error(err.message);
        }
      }

      socket.end();

      resolve();
    });
  });
});

let publishMetrics = co.wrap(function* (metrics) {
  let metricDatumByNamespace = _.groupBy(metrics, m => m.Namespace);
  let namespaces = _.keys(metricDatumByNamespace);
  for (let namespace of namespaces) {
    let datum = metricDatumByNamespace[namespace];

    try {
      yield cloudwatch.publish(datum, namespace);
    } catch (err) {
      console.error("failed to publish metrics", err.message);
      console.error(JSON.stringify(datum));
    }
  }
});

let processAll = co.wrap(function* (logGroup, logStream, logEvents) {
  let result = parse.all(logGroup, logStream, logEvents);

  if (result.logs) {
    yield sendLogs(result.logs);
  }

  if (result.customMetrics) {
    yield publishMetrics(result.customMetrics);
  }
});

module.exports = processAll;