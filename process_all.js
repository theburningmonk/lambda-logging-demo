'use strict';

const co      = require('co');
const Promise = require('bluebird');
const AWS     = require('aws-sdk');

// CONFIGURE THESE!!!
// ============================================
const region = "insert_value";
const accountId = "insert_value";
const funcName = "insert_value";
const retentionDays = 7;       // change this if you want
const prefix = '/aws/lambda';  // use '/' if you want to process every log group
// ============================================

AWS.config.region = region;
const destFuncArn = `arn:aws:lambda:${region}:${accountId}:function:${funcName}`;
const cloudWatchLogs = new AWS.CloudWatchLogs();
const lambda         = new AWS.Lambda();

let listLogGroups = co.wrap(function* (acc, nextToken) {
  let req = {
    limit: 50,
    logGroupNamePrefix: prefix,
    nextToken: nextToken
  };
  let resp = yield cloudWatchLogs.describeLogGroups(req).promise();

  let newAcc = acc.concat(resp.logGroups.map(x => x.logGroupName));
  if (resp.nextToken) {
    return yield listLogGroups(newAcc, resp.nextToken);
  } else {
    return newAcc;
  }
});

let subscribe = co.wrap(function* (logGroupName) {
  let options = {
    destinationArn : destFuncArn,
    logGroupName   : logGroupName,
    filterName     : 'ship-logs',
    filterPattern  : ''
  };

  try {
    yield cloudWatchLogs.putSubscriptionFilter(options).promise();
  } catch (err) {
    console.log(`FAILED TO SUBSCRIBE [${logGroupName}]`);
    console.error(JSON.stringify(err));

    if (err.retryable === true) {
      let retryDelay = err.retryDelay || 1000;
      console.log(`retrying in ${retryDelay}ms`);
      yield Promise.delay(retryDelay);
      yield subscribe(logGroupName);
    }
  }
});

let setRetentionPolicy = co.wrap(function* (logGroupName) {
  let params = {
    logGroupName    : logGroupName,
    retentionInDays : retentionDays
  };

  yield cloudWatchLogs.putRetentionPolicy(params).promise();
});

let processAll = co.wrap(function* () {
  let logGroups = yield listLogGroups([]);
  for (let logGroupName of logGroups) {    
    console.log(`subscribing [${logGroupName}]...`);
    yield subscribe(logGroupName);

    console.log(`updating retention policy for [${logGroupName}]...`);
    yield setRetentionPolicy(logGroupName);
  }
});

processAll().then(_ => console.log("all done"));