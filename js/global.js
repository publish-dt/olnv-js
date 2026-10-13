window.verApp = '1.0.0-alpha7';
window.netOffline = undefined;

window.onerror = function (message, url, line, col, error) {
	alert(message + "\n В " + line + ":" + col + " на " + url);
};

window.addEventListener('online', () => {
    window.netOffline = false;
});

window.addEventListener('offline', () => {
    window.netOffline = true;
});

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