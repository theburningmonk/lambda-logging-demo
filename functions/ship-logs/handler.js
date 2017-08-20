'use strict';

const co = require('co');
const processAll = require('./lib');

module.exports.handler = co.wrap(function* (event, context, callback) {
  yield processAll(event.logGroup, event.logStream, event.logEvents);
  callback(null, `Successfully processed ${event.logEvents.length} log events.`);
});