'use strict';

const co      = require('co');
const Promise = require('bluebird');
const parse   = require('./parse');
const tls     = require('tls');

let processAll = co.wrap(function* (logGroup, logStream, logEvents) {
  let lambdaVer = parse.lambdaVersion(logStream);

  let tlsOptions = {
    host: process.env.logstash_host,
    port: process.env.logstash_port
  };

  yield new Promise((resolve, reject) => {
    let socket = tls.connect(tlsOptions, function() {
      console.log(`connected to ${process.env.logstash_host}:${process.env.logstash_port}`);
      socket.setEncoding('utf8');

      for (let logEvent of logEvents) {
        try {
          let log = parse.logMessage(logEvent.message);
          log.level         = log.level || 'debug';
          log.logStream     = logStream;
          log.logGroup      = logGroup;
          log.lambdaVersion = lambdaVer;
          log.fields        = log.fields || {};
          log.type          = "cloudwatch";
          log['@timestamp'] = new Date(logEvent.timestamp);

          console.log("sending : ", log);
          socket.write(JSON.stringify(log) + '\n');
        } catch (err) {
          console.log(err, err.stack);
        }
      }

      socket.end();

      resolve();
    });
  });
});

module.exports = processAll;