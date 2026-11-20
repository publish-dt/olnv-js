const verApp = '1.0.0-beta24';
const namespace = 'olnv';
service = typeof service !== 'undefined' ? namespace+'.'+service : 'null';
environment = typeof environment !== 'undefined' ? environment : 'Production';
const typeApp = `${service}${typeof environment !== 'undefined' ? ('.' + environment) : ''}`;
let userID = localStorage.getItem('_olnv_userID');
if (!userID) {
    userID = uuidv4();
    localStorage.setItem('_olnv_userID', userID);
}
const counterYm = 114149527; // номер счётчика Яндекс.Метрика

sendOTLP = typeof sendOTLP !== 'undefined' ? sendOTLP : false;

function uuidv4() {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
    }
    // fallback для совсем старых окружений без crypto
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}