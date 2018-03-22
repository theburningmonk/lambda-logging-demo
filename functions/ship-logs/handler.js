'use strict';

const co         = require('co');
const Promise    = require('bluebird');
const processAll = require('./lib');
const zlib       = Promise.promisifyAll(require('zlib'));

module.exports.handler = co.wrap(function* (event, context, callback) {
  try {
    let payload = new Buffer(event.awslogs.data, 'base64');
    let json = (yield zlib.gunzipAsync(payload)).toString('utf8');

    // once decoded, the CloudWatch invocation event looks like this:
    // {
    //     "messageType": "DATA_MESSAGE",
    //     "owner": "374852340823",
    //     "logGroup": "/aws/lambda/big-mouth-dev-get-index",
    //     "logStream": "2018/03/20/[$LATEST]ef2392ba281140eab63195d867c72f53",
    //     "subscriptionFilters": [
    //         "LambdaStream_logging-demo-dev-ship-logs"
    //     ],
    //     "logEvents": [
    //         {
    //             "id": "33930704242294971955536170665249597930924355657009987584",
    //             "timestamp": 1521505399942,
    //             "message": "START RequestId: e45ea8a8-2bd4-11e8-b067-ef0ab9604ab5 Version: $LATEST\n"
    //         },
    //         {
    //             "id": "33930707631718332444609990261529037068331985646882193408",
    //             "timestamp": 1521505551929,
    //             "message": "2018-03-20T00:25:51.929Z\t3ee1bd8c-2bd5-11e8-a207-1da46aa487c9\t{ \"message\": \"found restaurants\" }\n",
    //             "extractedFields": {
    //                 "event": "{ \"message\": \"found restaurants\" }\n",
    //                 "request_id": "3ee1bd8c-2bd5-11e8-a207-1da46aa487c9",
    //                 "timestamp": "2018-03-20T00:25:51.929Z"
    //             }
    //         }
    //     ]
    // }
    let logEvent = JSON.parse(json);

    yield processAll(logEvent.logGroup, logEvent.logStream, logEvent.logEvents);
    callback(null, `Successfully processed ${logEvent.logEvents.length} log events.`);
  } catch (err) {
    callback(err);
  }
});