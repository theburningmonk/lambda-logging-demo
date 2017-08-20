'use strict';

const co             = require('co');
const Promise        = require('bluebird');
const AWS            = require('aws-sdk');
const cloudWatchLogs = Promise.promisifyAll(new AWS.CloudWatchLogs());
const destinationArn = process.env.DEST_FUNC;

let subscribe = function* (logGroupName) {
  let options = {
    destinationArn : destinationArn,
    logGroupName   : logGroupName,
    filterName     : 'ship-logs',
    filterPattern  : ''
  };

  yield cloudWatchLogs.putSubscriptionFilterAsync(options);
};

module.exports.handler = co.wrap(function* (event, context, callback) {
  console.log(JSON.stringify(event));
  
  let logGroupName = event.detail.requestParameters.logGroupName;
  console.log(`log group: ${logGroupName}`);

  yield subscribe(logGroupName);
  console.log(`subscribed [${logGroupName}] to [${destinationArn}]`);

  callback(null, 'ok');
});