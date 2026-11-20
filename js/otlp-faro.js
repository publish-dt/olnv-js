import { initializeFaro } from 'https://cdn.jsdelivr.net/npm/@grafana/faro-web-sdk@2.14.0/+esm';

const faro = initializeFaro({
    url: "https://faro-collector-prod-eu-west-2.grafana.net/collect/22f25f5cca7fed01b991fe520cafdf15",
    app: {
        name: typeApp,
        version: verApp,
        environment: environment,
    },
    sessionTracking: {
        enabled: true,
        session: {
            attributes: {
                service_namespace: namespace,
            },
        },
    },
    essionFlushIntervalMs: 30000, // отправлять в Grafana пакет один раз в 30 секунд
    autoAddInstrumentation: false, // отключаем автосбор
    beforeSend: function (item) {

        // оставляем только ошибки из консоли
        /*if (item.type === 'log') {
            // Для console.* Faro ставит уровень в item.meta.level: 'info', 'warn', 'error' и т.д.
            if (item.meta && item.meta.level !== 'error') {
                return null; // не отправлять
            }
        }*/

        // Отбрасываем метрики производительности
        if (item.type === 'event' && item.payload && item.payload.name === "faro.performance.resource")
            return null;

        if (item.type === 'measurement') { // это метрики производительности
            return null; // не отправлять
        }

        item.attributes = item.attributes || {};
        item.attributes['namespace'] = namespace;

        return item; // отправить как есть
    }
});

window.faroApi = faro.api;
faro.api.setUser({
    id: userID,
    attributes: {
        //role: 'admin',
    },
});

// https://grafana.com/docs/grafana-cloud/observe-and-act/monitor-applications/frontend-observability/instrument/custom-signals/logs/
faro.api.pushLog(['Запуск телеметрии faro'], {
    level: 'info', //LogLevel.INFO,
    context: {
        randomNumber: Math.random(),
    },
});


/*(function () {
    var webSdkScript = document.createElement("script");

    // fetch the latest 2.x.x version of the Web-SDK from the CDN
    webSdkScript.src =
        "https://unpkg.com/@grafana/faro-web-sdk@2/dist/bundle/faro-web-sdk.iife.js";

    webSdkScript.onload = () => {
        window.GrafanaFaroWebSdk.initializeFaro({
            url: "https://faro-collector-prod-eu-west-2.grafana.net/collect/22f25f5cca7fed01b991fe520cafdf15",
            app: {
                name: typeApp,
                version: verApp,
                environment: environment,
            },
            essionFlushIntervalMs: 30000, // отправлять в Grafana пакет один раз в 30 секунд
            autoAddInstrumentation: false, // отключаем автосбор
            beforeSend: function (item) {

                // оставляем только ошибки из консоли
                if (item.type === 'log') {
                    // Для console.* Faro ставит уровень в item.meta.level: 'info', 'warn', 'error' и т.д.
                    if (item.meta && item.meta.level !== 'error') {
                        return null; // не отправлять
                    }
                }

                // Отбрасываем метрики производительности
                if (item.type === 'event' && item.payload && item.payload.name === "faro.performance.resource")
                    return null;

                if (item.type === 'measurement') { // это метрики производительности
                    return null; // не отправлять
                }
                
                return item; // отправить как есть
            }
        });


        const ConsoleInstrumentation = window.GrafanaFaroWebSdk.ConsoleInstrumentation;
        window.GrafanaFaroWebSdk.faro.instrumentations.add(new ConsoleInstrumentation());

    };

    // Append the Web-SDK script script tag to the HTML page
    document.head.appendChild(webSdkScript);
})();*/
