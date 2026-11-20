(function () {
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
                // item.type: 'log', 'exception', 'measurement', 'trace' и т.п.
                // item.meta: дополнительные данные (включая уровень для console-событий)

                // Пример 1: оставляем только ошибки из консоли
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
                // Пример 2: можно убрать чувствительные данные из любого события
                // if (item.payload && item.payload.message) {
                //   item.payload.message = item.payload.message.replace(/TOKEN_\w+/g, '[REDACTED]');
                // }
                
                return item; // отправить как есть
            }
        });


        const ConsoleInstrumentation = window.GrafanaFaroWebSdk.ConsoleInstrumentation;
        window.GrafanaFaroWebSdk.faro.instrumentations.add(new ConsoleInstrumentation());

        /*// Load instrumentations at the onLoad event of the web-SDK and after the above configuration.
        // This is important because we need to ensure that the Web-SDK has been loaded and initialized before we add further instruments!
        var webTracingScript = document.createElement("script");

        // fetch the latest 2.x.x version of the Web Tracing package from the CDN
        webTracingScript.src =
            "https://unpkg.com/@grafana/faro-web-tracing@2/dist/bundle/faro-web-tracing.iife.js";

        // Initialize, configure (if necessary) and add the the new instrumentation to the already loaded and configured Web-SDK.
        webTracingScript.onload = () => {
            window.GrafanaFaroWebSdk.faro.instrumentations.add(
                //new window.GrafanaFaroWebTracing.TracingInstrumentation()
                new window.GrafanaFaroWebSdk.ConsoleInstrumentation()
            );
        };

        // Append the Web Tracing script script tag to the HTML page
        document.head.appendChild(webTracingScript);*/
    };

    // Append the Web-SDK script script tag to the HTML page
    document.head.appendChild(webSdkScript);
})();
