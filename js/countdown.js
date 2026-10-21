export { Countdown as default };

class Countdown {

    constructor(app) {
        this.app = app;

		/** обратный отсчёт */
		this.servTime = undefined; // время с сервера
		this.timeleft = -1; // (в секундах) сколько осталось секунд до ближайшего Посыла
		this.showBlock = false; // вкл/выкл отображение блока обратного отсчёта
		//diff = 0; // разница между временем на клиенте (в браузере) и на сервере
		this.countStartPosyl = 0; // сколько прошо времени с момента начала Посыла
		this.rndCounter = Math.floor(Math.random() * (20/*300*/ - 0 + 1)) + 0; // чтобы не в одно и тоже время все клиенты синхронизировали время обратного отсчёта
		this.period = 5000; // интервал времени (в сек.) для обновления в отображении обратного отсчёта
		this.timerOn = false; // признак активности таймера обратного отсчёта
		this.procBigDiff = false; // начат процесс получения времени с сервера, т.к. сайт находился в спящем режиме
		this.isDebugTimeleft = true; // вкл./выкл. отладчик обратного отсчёта
		this.localTime = undefined;
	}

	/** Обратный отсчёт до Посыла */
	countdown() {
		this.countStartPosyl += this.period / 1000;

		let today = 0;
		let thour = !this.showBlock ? 0 : Math.floor(this.timeleft / 3600);
		let tmin = !this.showBlock ? 0 : Math.floor(this.timeleft / 60 - 60 * thour);
		let tsec = !this.showBlock ? 0 : this.timeleft % 60;

		if (this.showBlock) {
			let timestr = '--';
			if (this.timeleft !== -1) timestr = (today > 0 ? '<span class="txt-gray">' + today + '</span>' + declOfNum(today, [' день ', ' дня ', ' дней ']) : '') + '<span class="txt-gray">' + thour + '</span>' + declOfNum(thour, [' час ', ' часа ', ' часов ']) + '<span class="txt-gray">' + tmin + '</span>' + declOfNum(tmin, [' минута ', ' минуты ', ' минут ']) + '<span class="txt-gray">' + tsec + '</span>' + " сек.";
			document.getElementById('timeleft').innerHTML = timestr;
			if (timeleftBlock.classList.contains('hidden')) {
				timeleftBlock.classList.remove('hidden');
			}
		}
		if (this.timeleft >= 0) {
			if (this.timeleft === 0 && this.showBlock) {
				this.showBlock = false;
				this.countStartPosyl = 0;
			}
			this.timeleft -= this.period / 1000;
		}

		if (!this.showBlock && this.countStartPosyl >= (0/*301*/ + this.rndCounter)) { // через 5+rnd минут после начала Посыла синхронизируем (получаем остаток времени до следующего Посыла)
			if (this.isDebugTimeleft) console.log('синхронизация через ~5 мин. после начала Посыла');

			//htmx.ajax('GET', '/ext/countdown', { handler: processJsonCountdown }); // нужно делать запрос, чтобы получить время следующего Посыла
			this.processJsonCountdown();
		}


		let diffServ = new Date() - this.servTime;
		let diffLocal = new Date() - this.localTime;
		// если разница во времени между сохранённой ранее локальной/клиентской датой и текущей локальной датой больше чем 5+5 сек, т.е. страница сайта была долго в спящем режиме (свёрнута или комп. был в спящем режиме)
		if (diffLocal > 10000) {
			if (this.procBigDiff === false /*&& checkIntervalAddUser(true)*/) { // когда окно браузера с сайтом свёрнуто, то js выполняет код раз в минуту, поэтому проверяем ещё и активность пользователя перед отправкой запроса
				this.procBigDiff = true;
				if (this.isDebugTimeleft) console.log('разница - ' + diffLocal + ' время = ' + new Date());

				//htmx.ajax('GET', '/ext/countdown', { handler: processJsonCountdown });
				this.processJsonCountdown();
			}
		}
		else {
			this.localTime = new Date();

			/*if (checkIntervalAddUser()) {
				htmx.ajax('POST', '/ext/addusr', { source: '#dummy' }); // каждые 5 мин. (активные intervalAddUser) обновляем активность пользователя на сервере
			}*/
		}

		this.servTime.setSeconds(this.servTime.getSeconds() + this.period / 1000); // поддерживаем в актуальном состоянии время, полученное с сервера

		if (this.isDebugTimeleft) {
			console.log('timeleft = ' + this.timeleft + /*'; rndLeft = ' + rndLeft + '; countFromLastUpdate = ' + countFromLastUpdate*/ + '; countStartPosyl = ' + this.countStartPosyl + '; rndCounter = ' + this.rndCounter + '; diffLocal = ' + diffLocal + '; diffServ = ' + diffServ);
			console.log('время = ' + new Date());
		}/**/
	}

	processJsonCountdown(/*data, detail*/) {
		const data = this.getTimeleft(); /*{
			ServerTime: new Date(),
			TimeLeft: 10, // сколько секунд до следующего Посыла
			ShowBlock: true, // если Посыл сейчас идёт (в течение 5 мин.), то = false
			PassTime: 0 // здесь не ноль, а сколько секунд прошло с последнего Посыла
		};*/
		this.servTime = data.ServerTime;
		this.timeleft = data.TimeLeft;
		this.showBlock = data.ShowBlock;
		this.countStartPosyl = data.PassTime;

		this.procBigDiff = false;
		/*diff = Math.abs(new Date() - servTime);
		if (this.isDebugTimeleft) console.log('diff = ' + diff);*/

		this.localTime = new Date();

		if (this.timerOn === false) {
			this.countdown();
			const countdownFn = this.countdown.bind(this);
			setInterval(countdownFn, this.period);
			this.timerOn = true;
			if (this.isDebugTimeleft) console.log('включен таймпер обновления обратного отсчёта');
		}
	}

	getTimeleft() {
		const res = this.getPrevNext();
		const now = new Date();
		if (res) {
			var nowDate = new Date(now);
			const nowDateSeconds = Math.floor(nowDate.getTime()/1000); // HelpersG.AnyToMoscow(DateTime.Now).DateTime; // текущее московское время (даже если приложение выполняется не в московском времени)

			let tmleft = res.pointNext - nowDateSeconds;

			// округляем остаток секунд до кратного 5
			var mod = tmleft % 5;
			tmleft = mod < 3 ? tmleft - mod : tmleft - mod + 5;

			const passTime = Math.abs(nowDateSeconds - res.pointPrev);

			return {
				ServerTime: new Date(now),
				TimeLeft: tmleft, // сколько секунд до следующего Посыла
				ShowBlock: passTime < 300 ? false : true, // если Посыл сейчас идёт (в течение 5 мин.), то = false
				PassTime: passTime // сколько секунд прошло с последнего Посыла
			};
		}
		else return {
			ServerTime: new Date(now),
			TimeLeft: -1,
			ShowBlock: false,
			PassTime: 0
		};
	}

	getPrevNext() {

		const countdownList = this.app.configApp.countdown;
		if (this.app.configApp.countdown && this.app.configApp.countdown.length > 0) {
			const now = new Date();//HelpersG.AnyToMoscow(DateTime.Now).DateTime; // текущее московское время (даже если приложение выполняется не в московском времени)
			const nowDate = new Date(now);
			nowDate.setHours(0, 0, 0, 0);

			for (let i = 0; i < countdownList.length; i++)
			{
				let nowDatePre = new Date(nowDate);
				let nowDateNext = new Date(nowDate);
				let iNext = i + 1;

				const prevArr = countdownList[i].split(':');
				const prev = (Number(prevArr[0]) * 60 * 60) + (Number(prevArr[1]) * 60); // в секундах с начала дня

				if (i == countdownList.length - 1)
					iNext = 0;

				const nextArr = countdownList[iNext].split(':');
				var next = (Number(nextArr[0]) * 60 * 60) + (Number(nextArr[1]) * 60); // в секундах с начала дня

				if (prev > next) {
					if ((this.getTotalSeconds(now) - prev) < 0) {
						nowDatePre.setDate(nowDatePre.getDate() - 1); //nowDate.AddDays(-1);
					}
					else {
						nowDateNext.setDate(nowDateNext.getDate() + 1); //nowDate.AddDays(1);
					}
				}

				const datePrev = new Date(nowDatePre);
				datePrev.setSeconds(prev);// nowDatePre.Add(prev);
				const dateNext = new Date(nowDateNext);
				dateNext.setSeconds(next);// nowDateNext.Add(next);
				if (now > datePrev && now < dateNext) // выбираем ближайшую большую сигнальную точку
				{
					return { pointPrev: Math.floor(datePrev.getTime() / 1000), pointNext: Math.floor(dateNext.getTime()/1000) };
				}
			}
		}

		return;
	}

	/**
	 * Получение количества секунд с начала дня
	 * @param {any} date
	 * @returns
	 */
	getTotalSeconds(date) {
		return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
	}
}