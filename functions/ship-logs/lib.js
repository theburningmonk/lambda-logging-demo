const Promise = require('bluebird')
const parse   = require('./parse')
const net     = require('net')
const host    = process.env.logstash_host
const port    = process.env.logstash_port
const token   = process.env.token

const processAll = async (logGroup, logStream, logEvents) => {
  const lambdaVersion = parse.lambdaVersion(logStream);
  const functionName  = parse.functionName(logGroup);

  await new Promise((resolve, reject) => {
    const socket = net.connect(port, host, function() {
      socket.setEncoding('utf8')

      for (const logEvent of logEvents) {
        try {
          const log = parse.logMessage(logEvent)
          if (log) {
            log.logStream     = logStream
            log.logGroup      = logGroup
            log.functionName  = functionName
            log.lambdaVersion = lambdaVersion
            log.fields        = log.fields || {}
            log.type          = "cloudwatch"
            log.token         = token

            socket.write(JSON.stringify(log) + '\n')
          }
        
        } catch (err) {
          console.error(err.message)
        }
      }

      socket.end()

      resolve()
    })
  })
}

module.exports = processAll