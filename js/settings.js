const verApp = '1.0.0-beta21';
const namespace = 'olnv';
service = typeof service !== 'undefined' ? service : 'null';
environment = typeof environment !== 'undefined' ? environment : 'Production';
const typeApp = `${service}${typeof environment !== 'undefined' ? ('.' + environment) : ''}`;
let userID = localStorage.getItem('_olnv_userID');
if (!userID) {
    userID = uuidv4();
    localStorage.setItem('_olnv_userID', userID);
}
const counterYm = 114149527; // номер счётчика Яндекс.Метрика

sendOTLP = typeof sendOTLP !== 'undefined' ? sendOTLP : false;