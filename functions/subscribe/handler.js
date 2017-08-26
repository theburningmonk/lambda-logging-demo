'use strict';

const co             = require('co');
const Promise        = require('bluebird');
const AWS            = require('aws-sdk');
const cloudWatchLogs = Promise.promisifyAll(new AWS.CloudWatchLogs());
const destArn        = process.env.DEST_FUNC;
const destFuncName   = destArn.split(":").reverse()[0];

let subscribe = function* (logGroupName) {
  let options = {
    destinationArn : destArn,
    logGroupName   : logGroupName,
    filterName     : 'ship-logs',
    filterPattern  : ''
  };

  yield cloudWatchLogs.putSubscriptionFilterAsync(options);
};

module.exports.handler = co.wrap(function* (event, context, callback) {
  console.log(JSON.stringify(event));
  
  // eg. /aws/lambda/logging-demo-dev-api
  let logGroupName = event.detail.requestParameters.logGroupName;
  console.log(`log group: ${logGroupName}`);

  if (logGroupName === `/aws/lambda/${destFuncName}`) {
    console.log("ignoring the log group for the ship-logs function to avoid invocation loop!");
    callback(null, 'ignored');
  } else {
    yield subscribe(logGroupName);
    console.log(`subscribed [${logGroupName}] to [${destArn}]`);
  
    callback(null, 'ok');
  }
});