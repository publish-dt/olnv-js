import { LoggerProvider, BatchLogRecordProcessor } from 'https://cdn.jsdelivr.net/npm/@opentelemetry/sdk-logs@0.208/+esm';
import { OTLPLogExporter } from 'https://cdn.jsdelivr.net/npm/@opentelemetry/exporter-logs-otlp-http@0.208/+esm';

const exporter = new OTLPLogExporter({
    url: 'http://2.56.88.201:4317/otlp/v1/logs',
    headers: {
        // base64("<instanceID>:<glc_token>")
    },
});

const loggerProvider = new LoggerProvider({
    processors: [new BatchLogRecordProcessor(exporter)],
});
const logger = loggerProvider.getLogger('olnv-web');
logger.emit({ body: 'привет из браузера' });