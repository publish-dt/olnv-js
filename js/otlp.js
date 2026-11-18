import { LoggerProvider, BatchLogRecordProcessor } from 'https://cdn.jsdelivr.net/npm/@opentelemetry/sdk-logs@0.222/+esm';
import { OTLPLogExporter } from 'https://cdn.jsdelivr.net/npm/@opentelemetry/exporter-logs-otlp-http@0.222/+esm';
import { resourceFromAttributes } from 'https://cdn.jsdelivr.net/npm/@opentelemetry/resources@2.11.0/+esm';

const exporter = new OTLPLogExporter({
    //url: 'http://2.56.88.201:4318/v1/logs',
    url: 'https://wnmsbpr1bkz1g1uypamxretc.2.56.88.201.sslip.io/v1/logs',
    //url: 'https://aspire-dashboard.onrender.com/v1/logs',
    headers: {
        // base64("<instanceID>:<glc_token>")
        'x-otlp-api-key': 'e3jjq8SAUmUWiHqQcWIBak6elxYFyTtUkIYRpYqZURFLN6nYerQT2JbUW5XSbd52S1BzJzqdwIGiFkrga1q53zTBx4Yk2xOHNETNuNcE1Dni3SfCDGIbMZYi8Z3FE6bY',
    },
});

window.loggerProvider = new LoggerProvider({
    resource: new resourceFromAttributes({
        'project.name': namespace,
        'service.namespace': namespace,
        'service.name': service, //typeApp,
        'service_name': `${namespace}.${typeApp}`,
        'service.instance.id': environment, //userID,
        'service.version': verApp,
        'deployment.environment': environment,
    }),/**/
    processors: [new BatchLogRecordProcessor({ exporter })],
});
const logger = loggerProvider.getLogger('otlp.js');
logger.emit({
    body: 'Запуск телеметрии',
    severityNumber: 12,//SeverityNumber.INFO,
    attributes: {
        userID: userID,
    }
});