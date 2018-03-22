'use strict';

const co             = require('co');
const Promise        = require('bluebird');
const AWS            = require('aws-sdk');
const cloudWatchLogs = Promise.promisifyAll(new AWS.CloudWatchLogs());
const retentionDays  = process.env.retention_days;

let setExpiry = function* (logGroupName) {
  let params = {
    logGroupName    : logGroupName,
    retentionInDays : retentionDays
  };

  yield cloudWatchLogs.putRetentionPolicyAsync(params);
};

module.exports.handler = co.wrap(function* (event, context, callback) {
  console.log(JSON.stringify(event));
  
  let logGroupName = event.detail.requestParameters.logGroupName;
  console.log(`log group: ${logGroupName}`);

  yield setExpiry(logGroupName);
  console.log(`updated [${logGroupName}]'s retention policy to ${retentionDays} days`);

  callback(null, 'ok');
});