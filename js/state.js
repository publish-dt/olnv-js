export { StateContainer as default };

class StateContainer {
    constructor() {
        this.updateInfo = {
            updateStarted: false,
            isLastCheckGood: undefined, // удачность последней проверки
            lastCheck: undefined, // время последней проверки (информация могла быть не загружена, т.к. её небыло или ошибка загрузки)
            lastUpdated: undefined // время последней проверки при которой была загружена информация
        };

        this.modelSearch = {};

        /** обратный отсчёт */
        /*this.countdown = {
			servTime: undefined, // время с сервера
			timeleft: -1, // (в секундах) сколько осталось секунд до ближайшего Посыла
			showBlock: false, // вкл/выкл отображение блока обратного отсчёта
			//diff: 0, // разница между временем на клиенте (в браузере) и на сервере
			countStartPosyl: 0, // сколько прошо времени с момента начала Посыла
			//countFromLastUpdate: 0, // сколько прошло времени с последнего обновления
			//rndLeft: 0,
			rndCounter: Math.floor(Math.random() * (300 - 0 + 1)) + 0, // чтобы не в одно и тоже время все клиенты синхронизировали время обратного отсчёта
			period: 5000, // интервал времени (в сек.) для обновления в отображении обратного отсчёта
			timerOn: false, // признак активности таймера обратного отсчёта
			procBigDiff: false, // начат процесс получения времени с сервера, т.к. сайт находился в спящем режиме
			isDebugTimeleft: true, // вкл./выкл. отладчик обратного отсчёта
			localTime: undefined
        };*/
    }
}
