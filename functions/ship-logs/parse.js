'use strict';

// logGroup looks like this:
//    "logGroup": "/aws/lambda/service-env-funcName"
let functionName = function (logGroup) {
  return logGroup.split('/').reverse()[0];
};

// logStream looks like this:
//    "logStream": "2016/08/17/[76]afe5c000d5344c33b5d88be7a4c55816"
let lambdaVersion = function (logStream) {
  let start = logStream.indexOf('[');
  let end = logStream.indexOf(']');
  return logStream.substring(start+1, end);
};

let requestIdFromSysLog = message => {
  let idx = message.indexOf('RequestId: ');

  // funny, JS string has multiple substring methods..
  // substr takes starting index & length
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substr
  // NOTE: "RequestId: " is 11 chars long, hence `+ 11` below, and request ID is
  // always a 36 char guid
  return message.substr(idx + 11, 36);
};

let isDate = function (str) {
  return !isNaN(Date.parse(str));
}

// a typical API Gateway log message looks like this:
//    "2017-04-26T10:41:09.023Z	db95c6da-2a6c-11e7-9550-c91b65931beb\tloading index.html...\n"
// but there are START, END and REPORT messages too:
//    "START RequestId: 67c005bb-641f-11e6-b35d-6b6c651a2f01 Version: 31\n"
//    "END RequestId: 5e665f81-641f-11e6-ab0f-b1affae60d28\n"
//    "REPORT RequestId: 5e665f81-641f-11e6-ab0f-b1affae60d28\tDuration: 1095.52 ms\tBilled Duration: 1100 ms \tMemory Size: 128 MB\tMax Memory Used: 32 MB\t\n"
let logMessage = function (message) {
  let type;
  if (message.startsWith('START RequestId') ||
      message.startsWith('END RequestId') ||
      message.startsWith('REPORT RequestId')) {
    type = 'SYS';
  } else {
    type = 'LOG';
  }

  if (type === 'SYS') {
    console.log('system message: ', message);
    let requestId = requestIdFromSysLog(message);
    return { 
      level  : 'debug',
      fields : { requestId }, 
      message };
  }

  console.log('non-system message: ', message);

  let parts = message.split('\t', 3);

  // likely API Gateway log message
  if (parts.length === 3 && isDate(parts[0])) {
    let timestamp  = parts[0];
    let requestId  = parts[1];
    let logMessage = parts[2];

    return { 
      level   : 'debug',
      message : logMessage,
      fields  : {
        '@timestamp' : timestamp,
        requestId
      }
    };
  }

  return {
    level   : 'debug',
    message : message
  };
};

module.exports = {
  functionName,
  lambdaVersion,
  requestIdFromSysLog,
  logMessage
};