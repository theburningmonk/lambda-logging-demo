'use strict';

const _      = require('lodash');
const co     = require('co');
const AWS    = require('aws-sdk');
const client = new AWS.CloudWatch();

let publish = co.wrap(function* (metricDatum, namespace) {
  let metricData = metricDatum.map(m => {
    return {
      MetricName : m.MetricName,
      Dimensions : m.Dimensions,
      Timestamp  : m.Timestamp,
      Unit       : m.Unit,
      Value      : m.Value
    };
  });

  // cloudwatch only allows 20 metrics per request
  let chunks = _.chunk(metricData, 20);

  for (let chunk of chunks) {
    let req = {
      MetricData: chunk,
      Namespace: namespace
    };
  
    yield client.putMetricData(req).promise();
  }  
});

module.exports = {
  publish
};