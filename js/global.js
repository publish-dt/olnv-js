window.onerror = function (message, url, line, col, error) {
	alert(message + "\n В " + line + ":" + col + " на " + url);
};

window.addEventListener('online', () => {
    window.netOffline = false;
});

window.addEventListener('offline', () => {
    window.netOffline = true;
});

const optShortDate = {
    year: "2-digit",
    month: "numeric",
    day: "numeric",
};

/*window.onload = function () {

}*/

/*function handleImgLoad(el) {
	debugger
}*/

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

function anyToMoscow(date) {
    return new Date(date);
}