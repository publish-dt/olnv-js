window.verApp = '1.0.0-alpha9';
window.netOffline = undefined;

window.onerror = function (message, url, line, col, error) {
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
    internetLostEl.style.display = 'none';
}
function intOffline() {
    window.netOffline = true;
    const internetLostEl = document.getElementById('internet-lost');
    internetLostEl.style.display = 'block';
}
check();
setInterval(check, 30000);


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

function strToDate(date) {
    return new Date(date);
}

const toShortMoscowDate = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: "2-digit",
    month: "numeric",
    day: "numeric"
});

const toDateTime = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
});


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

function clearAllData() {
    if (confirm(`Очистить базу данных? (версия: ${window.verApp})`)) {
        db.delete({ disableAutoOpen: false });

        //localStorage.clear();
        // Удаляем все ключи, начинающиеся с 'olnvjs_'
        for (let key of Object.keys(localStorage)) {
            if (key.startsWith('olnvjs_')) {
                localStorage.removeItem(key);
            }
        }

        caches.delete('cnt');
    }
}

footerYearEl = document.getElementById('footer-year');
footerYearEl.innerHTML = (new Date()).getFullYear();