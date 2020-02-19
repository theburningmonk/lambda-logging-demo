// logGroup looks like this:
//    "logGroup": "/aws/lambda/service-env-funcName"
const functionName = function (logGroup) {
  return logGroup.split('/').reverse()[0]
}

// logStream looks like this:
//    "logStream": "2016/08/17/[76]afe5c000d5344c33b5d88be7a4c55816"
const lambdaVersion = function (logStream) {
  const start = logStream.indexOf('[')
  const end = logStream.indexOf(']')
  return logStream.substring(start+1, end)
}

const tryParseJson = function (str) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}

// a Lambda function log message looks like this:
//    "2017-04-26T10:41:09.023Z	db95c6da-2a6c-11e7-9550-c91b65931beb\tloading index.html...\n"
// but there are START, END and REPORT messages too:
//    "START RequestId: 67c005bb-641f-11e6-b35d-6b6c651a2f01 Version: 31\n"
//    "END RequestId: 5e665f81-641f-11e6-ab0f-b1affae60d28\n"
//    "REPORT RequestId: 5e665f81-641f-11e6-ab0f-b1affae60d28\tDuration: 1095.52 ms\tBilled Duration: 1100 ms \tMemory Size: 128 MB\tMax Memory Used: 32 MB\t\n"
const parseLogMessage = function (logEvent) {
  if (logEvent.message.startsWith('START RequestId') ||
      logEvent.message.startsWith('END RequestId') ||
      logEvent.message.startsWith('REPORT RequestId')) {
    return null
  }

  // NOTE: This is how the event actually looks now: "INFO\t{"level":"DEBUG","message":"generated HTML 18255 bytes"}\n"
  // calling JSON.parse operation on the event would fail
  const { event, timestamp, request_id: requestId } = logEvent.extractedFields;
  const splittedEvent = event.split('\t')[1]; // Anything after \t (eg: "INFO\t{"level":"DEBUG","message":"generated HTML 18255 bytes"}\n")

  let fields = tryParseJson(splittedEvent)
  if (fields) {
    fields.requestId = requestId

    let level = (fields.level || 'debug').toLowerCase()
    let message = fields.message

    // level and message are lifted out, so no need to keep them there
    delete fields.level
    delete fields.message

    return { level, message, fields, '@timestamp': new Date(timestamp) }
  } else {
    return {
      level        : 'debug',
      message      : event,
      '@timestamp' : new Date(timestamp)
    }
  }
}

module.exports = {
  functionName,
  lambdaVersion,
  logMessage: parseLogMessage
}
