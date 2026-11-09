window.verApp = '1.0.0-beta17';
window.netOffline = undefined;
window.moveCounter = 0; // счётчик движения мыши на странице, если =0, то пользователь не активен на странице
window.isActiveApp; // прриложение активно/видимо на экране
window.isOnDebug;
moment.tz.add("Europe/Moscow|LMT MMT MMT MST MDST MSD MSK +05 EET EEST MSK|-2u.h -2u.h -2v.j -3v.j -4v.j -40 -30 -50 -20 -30 -40|01232434565756865656565656565656565698656565656565656565656565656565656565656a6|-3D8Ou.h 1sQM0 2pyW.W 1bA0 11X0 GN0 1Hb0 c4v.j ik0 3DA0 dz0 15A0 c10 2q10 iM10 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cN0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|16e6");

// https://metrika.yandex.ru/support/metrica/ru/data/visit-params-data
/*window.ym?.(ID_СЧЁТЧИКА, 'params', {
    version: verApp, // версию приложения надо передавать, чтобы понимать, не работают ли пользователи с очень старой версией
    //mode: mode,
});*/
const counterYm = 114149527;
typeApp = typeof typeApp !== 'undefined' ? typeApp : 'null';
const paramsYm = {
    "type-app": typeApp, // тип приложения: spa, wpf, ext - расширение браузера
    version: verApp, // версию приложения надо передавать, чтобы понимать, не работают ли пользователи с очень старой версией
};

window.onerror = function (message, url, line, col, error) {
    if (window.isOnDebug)
        alert(message + "\n В " + line + ":" + col + " на " + url);
};

/** Проверка доступности Интернета */
window.addEventListener('online', () => {
    intOnline();
});
window.addEventListener('offline', () => {
    intOffline();
});
async function checkInternet() {
    try {
        const response = await fetch('https://api.browser.yandex.ru/generate_204', {
            method: 'HEAD',
            cache: 'no-store',
        });
        return response.ok; // 204 → true
    } catch {
        return false;
    }
}
const check = async () => {
    const online = await checkInternet();
    if (online) intOnline();
    else intOffline();
};
function intOnline() {
    window.netOffline = false;
    const internetLostEl = document.getElementById('internet-lost');
    if (internetLostEl) internetLostEl.style.display = 'none';
}
function intOffline() {
    window.netOffline = true;
    const internetLostEl = document.getElementById('internet-lost');
    if (internetLostEl) internetLostEl.style.display = 'block';
}
check();
setInterval(check, 30000);


// склонение числительных
function declOfNum(number, titles) {
    cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}
function getDeclension(number, nominativ, genetiv, plural) {
    number = number % 100;
    if (number >= 11 && number <= 19) {
        return plural;
    }

    var i = number % 10;
    switch (i) {
        case 1:
            return nominativ;
        case 2:
        case 3:
        case 4:
            return genetiv;
        default:
            return plural;
    }
}

function intToRoman(num) {
    if (num < 1 || num > 3999) {
        throw new Error('Число должно быть от 1 до 3999');
    }

    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

    let result = '';
    for (let i = 0; i < values.length; i++) {
        while (num >= values[i]) {
            result += symbols[i];
            num -= values[i];
        }
    }
    return result;
}

function getMonthName(monthIndex) {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return months[monthIndex];
}

function intToRoman(num) {
    // Массив пар отсортирован от большего к меньшему
    const romanMap = [
        [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
        [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
        [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
    ];

    let result = "";

    for (const [value, symbol] of romanMap) {
        // Пока текущее число больше или равно значению из пары
        while (num >= value) {
            result += symbol; // Добавляем символ к результату
            num -= value;     // Вычитаем значение из числа
        }
    }

    return result;
}


/** Возвращаем московское время */
function toMoscowDate(date) {
    const dt = moment.tz(date, 'Europe/Moscow');
    return dt;
}
/** Возвращаем московское время (в эту функцию всегда должно приходить московское время) */
function strToDate(isoString) {
    const dateMoscow = new Date(isoString);
    //const dateMoscow = moment.tz(isoString, 'Europe/Moscow');
    return dateMoscow;
}
/** Форматирование даты */
const toShortMoscowDate = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: "2-digit",
    month: "numeric",
    day: "numeric"
});
const toFoolYearMoscowDate = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: "numeric",
    month: "numeric",
    day: "numeric"
});
const toDateTime = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
});
/** Формат даты в yyyy/MM/dd */
function formatDateCld(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // месяц с 0 до 11
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}/${mm}/${dd}`;
}
/** Получаем дату из path */
function getDateFromPath(path) {
    const matchPath = path.match(/(?<prefix>.*\/)?(\d{2}-)?(?<day>\d{2})\.(?<month>\d{2})\.(?<year>\d{2})(_\d{1})?/);
    if (matchPath) {
        const day = matchPath.groups["day"];
        const month = matchPath.groups["month"];
        const year = matchPath.groups["year"];
        if (day && month && year)
            return new Date(Number('20' + year), Number(month) - 1, Number(day));
    }
}
/*function toMoscowDate(date) {
    const timeZone = 'Europe/Moscow';
    const options = {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3, // Включаем миллисекунды с точностью до 3 цифр
        hour12: false,
    };
    // Форматируем дату в нужном поясе
    const parts = Intl.DateTimeFormat('en-US', options).formatToParts(date);

    // Находим час и минуту в этом поясе
    let hour = 0, minute = 0, second = 0, ms = 0;
    for (const part of parts) {
        if (part.type === 'hour') hour = parseInt(part.value, 10);
        if (part.type === 'minute') minute = parseInt(part.value, 10);
        if (part.type === 'second') second = parseInt(part.value, 10);
        if (part.type === 'fractionalSecond') ms = parseInt(part.value, 10);
    }

    const dateMoscowZone = new Date(date);
    dateMoscowZone.setHours(hour, minute, second, ms);

    return dateMoscowZone;
}

function toMoscowDate(date, fromDB) {
    let dateLocal;
    if (date) dateLocal = new Date(date);
    else dateLocal = new Date();
    //const targetOffset = date ? Math.abs(getTimeZoneOffset(dateLocal)) : 180; // UTC+3 (но, например, для 2013 года будет UTC+4)
    const targetOffset = date ? getTimeZoneOffset(date) : - 180;
    let adjustedTimestamp;
    if (fromDB) adjustedTimestamp = dateLocal.getTime() + (dateLocal.getTimezoneOffset() * 60 * 1000) - (targetOffset * 60 * 1000);
    else adjustedTimestamp = dateLocal.getTime() - (dateLocal.getTimezoneOffset() * 60 * 1000) + (targetOffset * 60 * 1000);
    const now = new Date(adjustedTimestamp); // московское время (даже если приложение выполняется не в московском времени)

    return now;
}
function getTimeZoneOffset(date) {
    //const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeZone = 'Europe/Moscow';
    const options = {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };
    // Форматируем дату в нужном поясе
    const parts = Intl.DateTimeFormat('en-US', options).formatToParts(date);

    // Находим час и минуту в этом поясе
    let hour = 0, minute = 0, second = 0;
    for (const part of parts) {
        if (part.type === 'hour') hour = parseInt(part.value, 10);
        if (part.type === 'minute') minute = parseInt(part.value, 10);
        //if (part.type === 'second') second = parseInt(part.value, 10);
    }

    // Теперь создаём дату в UTC и считаем разницу
    //const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute));
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes());

    const localDateInTargetZone = new Date(utcDate);//date
    localDateInTargetZone.setHours(hour, minute, 0, 0);

    // Хитрость: проще всего получить смещение как разницу между «датой в целевом поясе» и UTC
    // Но самый надёжный способ без библиотек — сравнить timestamp
    const targetTimestamp = localDateInTargetZone.getTime();
    const utcTimestamp = utcDate.getTime();
    const diffMs = utcTimestamp - targetTimestamp;
    return Math.round(diffMs / (1000 * 60)); // в минутах
}*/


function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

function createDB(exists) {
    
    if (!exists) {
        window.db = new Dexie('OtkDB');
        db.version(1).stores({
            infos: 'Id, Link, Data.Next, Catalog, Date',
            quote: '++Number',
            settings: 'name'
        });
        db.open();
    }
}

function openCache(name) {
    caches.open(name)
        .then(cache => window.cache = cache);
}


async function download(baseUrl, path, updateCount) {
    let url = baseUrl;
    if (path) url = url + path;

    try {
        if (url !== undefined) {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                //throw new Error(`Ошибка загрузки ${url}`);
                //console.log(`Ошибка загрузки ${url}`);
                return;
            }

            const data = await response.json();

            if (updateCount < 1) {
                const serverLostEl = document.getElementById('server-lost');
                if (serverLostEl) serverLostEl.style.display = 'none';
            }
            return data;
        }
    } catch (error) {
        if (error.message === 'Failed to fetch') {
            console.log(`Ресурс ${url} недоступен:`, error.message);
            if (updateCount < 1) {
                const urlFromDNS = await getAddressFromDNS();
                if (urlFromDNS) {
                    window.app.urlUpdate = urlFromDNS;
                    return await download(urlFromDNS, path, ++updateCount);
                }
                else {
                    const serverLostEl = document.getElementById('server-lost');
                    serverLostEl.style.display = 'block';
                }
            }
        }
        else console.error(`Ошибка при скачивании ${url}:`, error);
    }
}

// получаем хост/url из DNS-записи
async function getAddressFromDNS() {
    // список публичных dns-resolvers можно получить здесь: https://en.wikipedia.org/wiki/DNS_over_HTTPS или https://dnsprivacy.org/public_resolvers/#dns-over-https-doh

    if (this.app.configApp.domainDNS) {
        const res = await download("https://dns.google/resolve?name=" + this.app.configApp.domainDNS + "&type=TXT");
        if (res && res.Answer && res.Answer.length > 0) {
            const data = res.Answer[0].data;
            if (data) {
                const dataArr = data.replace(/'/gi, '').split('=');
                if (dataArr && dataArr.length > 1 && dataArr[0] === 'dnslink' && dataArr[1]) return dataArr[1];
            }
        }

        /*let xhr = new XMLHttpRequest();
        xhr.open("GET", "https://dns.google/resolve?name=" + this.app.configApp.domainDNS + "&type=TXT");
        xhr.send();

        xhr.onload = function () {
            if (xhr.status === 200) {
                const res = JSON.parse(xhr.response);
                if (res.Answer && res.Answer.length > 0) {
                    const data = res.Answer[0].data;
                    dataArr = data.replace(/"/gi, '').split('=');
                    if (dataArr && dataArr.length > 1) return dataArr[1];
                }
            }
            else {
                if (isOnDebug) console.log("Ошибка при получении url: " + xhr.status);
            }
        };

        xhr.onerror = function () { // происходит, только когда запрос совсем не получилось выполнить
            if (isOnDebug) console.log("Ошибка соединения");
        };*/
    }
}


function setDomain(el) {
    if (el.value) {
        window.app.urlUpdate = el.value;
    }
    else window.app.urlUpdate = window.app.configApp.urlUpdate;
    window.app.settings.urlUpdate = el.value;
}
function setDomainInput(el) {
    localStorage.setItem('olnvjs_urlUpdate', el.value);
}

/** вкл/откл. звёздное небо */
function OnOffStarsBg(isOff) {
    if (isOff) {
        document.body.style.cssText = 'background: #000E2B';
    }
    else {
        document.body.style.cssText = 'background: #000 url("../img/stars.gif") repeat fixed 0% 0%';
    }
    window.app.settings.isOffStarsBg = isOff;
    localStorage.setItem('olnvjs_isOffStarsBg', isOff);
}

/** вкл/откл. режим отладки */
function OnOffDebug(isOn) {
    window.isOnDebug = isOn;
    window.app.settings.isOnDebug = isOn;
    localStorage.setItem('olnvjs_isOnDebug', isOn);
}
/** вкл/откл. нумерацию стихов при печати */
function OnOffNumByPrint(isOn) {
    window.isNumByPrint = isOn;
    window.app.settings.isNumByPrint = isOn;
    localStorage.setItem('olnvjs_isNumByPrint', isOn);
}
/** вкл/откл. диалог оповещения пользователя */
function OnOffAlert(isOn) {
    window.isAlert = isOn;
    window.app.settings.isAlert = isOn;
    localStorage.setItem('olnvjs_isAlert', isOn);
}

window.toggleMenuBtnEl = document.querySelector('.navbar-toggle');
if (window.toggleMenuBtnEl) {
    window.menuEl = document.getElementById("bs-navbar");
    window.toggleMenuBtnEl.addEventListener('click', function () {
        window.menuEl.classList.toggle("in");
    });
}

// нумерация четверостиший Катренов
var configIsotip = {
    placement: 'left',     // позиция по умолчанию
    html: false,          // true — всегда воспринимать содержимое как HTML
    tooltipOffset: 4,    // отступ от элемента
    removalDelay: 0,     // задержка перед удалением подсказки из DOM
    //container: 'p.poem',
    windowPadding: { // window bounds for tooltip repositioning
        left: 0
    }
};
isotip.init(configIsotip);
function tooltipstering(isPrint) {
    if (isPrint === undefined) isPrint = false;

    let counterNumbPoem = 1;
    const pageMain = document.getElementsByClassName('poem-blok');
    if (pageMain) {
        if (pageMain.length > 0) {
            const pageMainEl = pageMain[0];
            let elements = pageMainEl.children;
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i]
                if (element == null) continue

                if (element.className.toLowerCase() === "page-title" || element.className.toLowerCase() === "next") counterNumbPoem = 1;
                if (element.classList.contains("poem")) {
                    if (!isPrint) {
                        element.classList.add('tooltip-click'); // hover
                    }

                    if (!isPrint || (isPrint && isNumByPrint)) element.setAttribute('data-tooltip-content', counterNumbPoem);

                    counterNumbPoem++;
                }
            }
        }
    }
}

const footerYearEl = document.getElementById('footer-year');
footerYearEl.innerHTML = (new Date()).getFullYear();

function pad(n, len) {
    n = String(n);
    while (n.length < len) n = '0' + n;
    return n;
}

const months = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
