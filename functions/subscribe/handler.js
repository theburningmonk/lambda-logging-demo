'use strict';

const co             = require('co');
const Promise        = require('bluebird');
const AWS            = require('aws-sdk');
const cloudWatchLogs = Promise.promisifyAll(new AWS.CloudWatchLogs());
const accountId      = process.env.account_id;
const region         = AWS.config.region;
const prefix         = process.env.prefix;

function getDestFuncArn() {
  // a Lambda function ARN looks like this:
  // arn:aws:lambda:<region>:<account id>:function:<function name>
  let destFunc = process.env.dest_func;
  if (!destFunc) {
    throw new Error("please specify either a function name or ARN in the dest_func environment variable");
  }

  if (destFunc.startsWith("arn:aws:lambda")) {
    return destFunc;
  } else {
    return `arn:aws:lambda:${region}:${accountId}:function:${destFunc}`;
  }
}

function getDestFuncName() {
  return getDestFuncArn().split(":").reverse()[0];
}

let subscribe = function* (logGroupName) {
  let options = {
    destinationArn : getDestFuncArn(),
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

  let destFuncArn = getDestFuncArn();
  let destFuncName = getDestFuncName();

  if (logGroupName === `/aws/lambda/${destFuncName}`) {
    console.log(`ignoring the log group for [${destFuncName}] function to avoid invocation loop!`);
    callback(null, 'ignored');
  } else if (prefix && !logGroupName.startsWith(prefix)) {
    console.log(`ignoring the log group [${logGroupName}] before it doesn't match the prefix [${prefix}]`);
    callback(null, 'ignored');
  } else {
    yield subscribe(logGroupName);
    console.log(`subscribed [${logGroupName}] to [${destFuncArn}]`);
  
    callback(null, 'ok');
  }
});