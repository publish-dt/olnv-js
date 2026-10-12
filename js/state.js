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
    }
}
