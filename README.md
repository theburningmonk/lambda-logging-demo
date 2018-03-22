# lambda-logging-demo

A group of Lambda functions for:
* shipping logs to Logz.io (hosted ELK stack)
* auto-subscribe new log groups to the aforementioned function so you don't have to subscribe them manually
* auto-updates the retention policy of new log groups to 7 days (configurable)

To deploy this function: 

1. insert the `logstash_host`, `logstash_port` and `token` in the `serverless.yml` file (under the `ship-logs-to-logzio` function's environment variables). e.g.

```
ship-logs-to-logzio:
  handler: functions/ship-logs/handler.handler
  description: Sends CloudWatch logs to Logz.io
  environment:
    logstash_host: <INSERT VALUE HERE>
    logstash_port: <INSERT VALUE HERE>
    token: <INSERT VALUE HERE>
```

`token`: your Logz.io account token. Can be retrieved on the Settings page in the Logz.io UI.
`logstash_host`: if you are in the EU region insert `listener-eu.logz.io`, otherwise, use `listener.logz.io`. You can tell which region you are in by checking your login URL - app.logz.io means you are in the US. app-eu.logz.io means you are in the EU.
`logstash_port`: this should be 5050, but is subject to change. See [this](https://app.logz.io/#/dashboard/data-sources/logstash) page for details.

2. run `./build.sh deploy dev` to deploy to a stage called "dev"