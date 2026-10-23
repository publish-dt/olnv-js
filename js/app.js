import DB from './db.js';
import Router from './router.js';
import StateContainer from './state.js';
import Search from './search.js';
import Views from './views.js';
import Cld from './cld.js';
import Countdown from './countdown.js';

class App {
	constructor() {
		this.appName = 'Откровения людям Нового века';

		this.configApp = {
			minYear: 2004,
			// 'https://cors-anywhere.herokuapp.com/https://otk-data.web.app'    http://otk-data.website.yandexcloud.net
			urlUpdate: 'https://otk-data.website.yandexcloud.net', // 'data', // 'https://otk-data.pages.dev', //
			countdown: ["0:37", "03:00", "11:00", "19:00"], // список времени обратного отсчёта до Посыла (результат отображается на сайте в секции "Обратный отсчёт")
		};
		this.catalogs = {
			dict: '618028f53fbe9a7a22fa9e82',
			tolk: '55d6a586b6b9a45a700f9eee',
			poems: '570ef2fcd07cda3e16f93ef7',
			notices: '5eeb5170ee6d7619745b6675',
			infos: "569d8556d07cda0a2b222693"
		};
		this.catalogsName = {
			[this.catalogs.dict]: 'Диктовки',
			[this.catalogs.tolk]: 'Послания',
			[this.catalogs.poems]: 'Катрены',
			[this.catalogs.notices]: 'Объявления',
			[this.catalogs.infos]: 'Информация',
		};
		this.catalogsIsNext = [ // список ID каталогов, по которым можно перемещаться вперёд/назад
			this.catalogs.dict,
			this.catalogs.tolk,
			this.catalogs.poems
		];
		this.routes = [
			{
				Name: "Объявления",
				//ToMenu: true,
				Catalogs: [
					this.catalogs.notices
				],
				ByLink: false,
				Route: ["novosti"],
				Title: "Новости и объявления"
			},
			{
				Name: "Откровения",
				//ToMenu: true,
				View: "InfoList",
				Catalogs: [
					this.catalogs.dict
				],
				ByLink: false,
				Route: ["otkroveniya"],
				Title: "Послания за ",
				ParamView: [ true ]
			},
			{
				Name: "Толкования",
				//ToMenu: true,
				View: "InfoList",
				Catalogs: [
					this.catalogs.tolk
				],
				ByLink: false,
				Route: ["tolkovaniya"],
				Title: "Толкования Откровений",
				ParamView: [true]
			},
			{
				Name: "Новые тексты",
				//ToMenu: true,
				View: "InfoList",
				Catalogs: [
					this.catalogs.tolk
				],
				ByLink: false,
				Route: ["year", "{year:int}"],
				Title: "Послания за ",
				ParamView: [true, 'year']
			},
			{
				Name: "Катрены",
				//ToMenu: true,
				View: "InfoList",
				Catalogs: [
					this.catalogs.poems
				],
				ByLink: false,
				Route: ["poems/year", "poems/{year:int}"],
				Title: "Катрены из Откровений за ",
				ParamView: [true, 'year']
			}
		];
		this.specDate = {
			"2010/07/22": "Обращение Создателя к населению России",
			"2010/08/17": "ОБРАЩЕНИЕ СОЗДАТЕЛЯ ПЕРЕД 26 АВГУСТА",
			"2012/11/26": "Вселенский Собор",
			"2013/07/26": "Великое Вселенское Вече Начала Начал",
			"2014/07/26": "Великое Вече «МЫ ГОТОВЫ»",
			"2014/11/17": "Вече «МЫ В ВЕЧНОСТИ»"/*,
			"2015/08/26": "Вече «НАДЕЖДА»",
			"2016/05/20": "I Форум",
			"2016/06/26": "II Форум",
			"2016/09/26": "III Форум",
			"2016/12/08": "IV Форум",
			"2018/02/24": "V Форум",
			"2018/12/08": "VI Форум",
			"2019/06/17": "VII Форум",
			"2019/12/19": "VIII Форум",
			"2020/09/26": "IX Форум",
			"2022/06/26": "X Форум",
			"2022/12/18": "XI Форум",
			"2024/02/09": "XII Форум",
			"2024/08/26": "Конгресс «Материя, Энергия, Информация» (XIII Форум)",
			"2025/09/03": "XIV Форум"*/
		};

		// для управления состоянием приложения
		this.stateContainer = new StateContainer();

		this.router = new Router(this);
		this.myDB = new DB(this);
		this.search = new Search(this);
		this.views = new Views(this);
		this.cld = new Cld(this);
		this.countdown = new Countdown(this);
	}

	async init() {

        try {

			/** Заполняем блок Обновления */
			const isLastCheckGood = JSON.parse(localStorage.getItem('olnvjs_isLastCheckGood'));

			let lastCheck = localStorage.getItem('olnvjs_lastCheck');
			if (lastCheck)
				lastCheck = new Date(lastCheck.replace(/"/g, ''));

			let lastUpdated = localStorage.getItem('olnvjs_lastUpdated');
			if (lastUpdated)
				lastUpdated = new Date(lastUpdated.replace(/"/g, ''));

			this.stateContainer.updateInfo.isLastCheckGood = isLastCheckGood;
			this.stateContainer.updateInfo.lastCheck = lastCheck;
			this.stateContainer.updateInfo.lastUpdated = lastUpdated;
			this.buildBlockUpdate(isLastCheckGood, lastCheck, lastUpdated);

			this.stateContainer.lastTolk = JSON.parse(localStorage.getItem('olnvjs_lastTolk'));
			this.stateContainer.lastPoem = JSON.parse(localStorage.getItem('olnvjs_lastPoem'));


			window.mainContEl = document.getElementById('main-cont');
			window.quoteBlockEl = document.getElementById('quote-block');
			window.formEl = document.getElementById('search');
			window.percentUpdatedEl = document.getElementById('percent-updated');
			window.CldEl = document.getElementById('caleandar');
			window.timeleftBlock = document.getElementById('timeleft-block');

			const isExist = await Dexie.exists('OtkDB');
			if (!isExist)
				createDB();

			this.myDB.fillDb();

			this.cld.buildCalendar();

			this.countdown.processJsonCountdown();


			/** получаем последнюю открытую пользователем страницу */
			let pathChanged = false;
			this.basePath = this.getPath(document.baseURI, true);
			let path = this.getPath(location.href);
			/*if (path === 'index') {
				const bookmarks = await dbApp.settings.get('bookmarks');
				if (bookmarks) {
					path = bookmarks['#lastPage#'];
					pathChanged = true;
				}
			}*/
			const state = await this.router.navigateToPath(path, true);
			//if (pathChanged) this.setHistory(state);

		} catch (e) {
			console.error(e);
        }
	}

	getPath(url, isBase) {
		//const baseURI = document.baseURI; // (document.querySelector('base')).href;
		//const urlData = new URL(url, document.baseURI);

		let arrPath = url.split('/');
		arrPath = arrPath.slice(3);
		url = arrPath.join('/');
		let path = url.replace(this.basePath, '').replace('.html', '');
		if (path === '' && !isBase) {
			path = 'index';
        }

		return path;
	}

	setHistory(state) {
		if (state) { //  && state.path !== 'index' с этим, при переходе на главную, не меняет адресную строку
			history.pushState(state, '', '/' + this.basePath + (state.path === 'index' ? '' : `${state.path}${!state.path.startsWith('search?') ? '.html' : ''}${state.hash ? '#' + state.hash : ''}`));
		}
	}

	
	buildBlockUpdate(isLastCheckGood, lastCheck, lastUpdated) {
		const lastCheckEl = document.getElementById('last-check');
		lastCheckEl.innerHTML = lastCheck ? toDateTime.format(lastCheck) : '--';
		lastCheckEl.style.cssText = (isLastCheckGood === false) ? 'color: peru !important;' : '';
		lastCheckEl.title = (isLastCheckGood === false) ? 'Неудачная проверка обновлений' : 'Время последней проверки по наличию новой информации';

		const lastlastUpdatedEl = document.getElementById('last-updated');
		lastlastUpdatedEl.innerHTML = lastUpdated ? toDateTime.format(lastUpdated) : '--';
	}
}

const app = new App();
Dexie.exists('OtkDB').then(function (exists) {
	createDB();

	app.init();
});/**/
/*window.db = new Dexie('OtkDB');
db.version(1).stores({
	infos: 'Id, Link, Data.Next, Catalog, Date',
	quote: '++Number',
	settings: 'name' 
});*/

window.dbApp = new Dexie('OtkApp');
dbApp.version(1).stores({
	settings: 'name'
});

caches.open('cnt')
	.then(cache => window.cache = cache);


window.onclick = async function (event) {
	let targetEl = event.target;
	let url = event.target.href;
	// элемент, по которому кликнули может не являться ссылкой
	if (!url && event.target.parentElement && event.target.parentElement.href) {
		url = event.target.parentElement.href;
		targetEl = event.target.parentElement;
	}

	if (url !== undefined) {
		const arrPath = url.split('/');
		if (location.host === arrPath[2]) {
			event.preventDefault(); // нужно размещать обязательно перед fillDb, иначе fetch не сработает

			let path = app.getPath(url);
            if (path !== '#') {
				if (path.endsWith('-next')) {
					const labelNextEl = document.getElementById('label-next');
					labelNextEl.style.display = 'none';
					const spinnerNextEl = document.getElementById('spinner-next');
					spinnerNextEl.style.display = 'inline-block';

					await app.myDB.fillDb(true);

					labelNextEl.style.display = 'inline-block';
					spinnerNextEl.style.display = 'none';
				}
				try {
					const state = await app.router.navigateToPath(path, false, targetEl);
				} catch (e) {
					console.error(e);
				}
            }
		}
	}
	/*else if (targetEl.type === "button") {
		const olnvUpdate = targetEl.dataset.olnvUpdate;
		if (olnvUpdate === 'check') app.myDB.fillDb();
    }*/
}

window.addEventListener('popstate', async function (event) {
	let path = '/';

	if (event.state) {
		// Восстанавливаем состояние приложения
		console.log('Состояние изменилось:', event.state);
		path = event.state.path;
		// Например, обновляем содержимое страницы
	} else {
		// Если event.state === null, значит, пользователь вернулся к записи, созданной при обычной загрузке страницы
		// Отображаем содержимое по умолчанию
		console.log('Пользователь вернулся к начальной записи');
		if (location.pathname === '/') {
			path = 'index';
        }
	}

	await app.router.navigateToPath(path);
});

window.onsubmit = async function (event) {
	event.preventDefault();

	const searchString = formEl.querySelector('#searchString').value;
	const where = formEl.querySelector('#where').value;

	//console.log('Форма отправлена!' + searchString);
	const state = await app.router.navigateToPath(`search?SearchString=${searchString}&Where=${where}`);

	//app.setHistory(state);
};

const updateBtnEl = document.getElementById('btn-update');
updateBtnEl.onclick = async function (event) {
	const res = await app.myDB.fillDb();
	
	if (res && Object.keys(res).length > 0 && (res.numberNewData > 0 || res.numberChangeData > 0)) {
		// Получаем дату из path
		const datePath = getDateFromPath(location.pathname);
		let monthCld;
		let yearCld;
		if (datePath) {
			monthCld = datePath.getMonth();
			yearCld = datePath.getFullYear();
		}

		await app.cld.getDataCalendar(yearCld, monthCld);
	}
}

/** Сигнализирует, что пользователь активен/находится на странице */
window.addEventListener('scroll', function () {
	typeof moveCounter !== 'undefined' ? moveCounter++ : 0;
});
const pageEl = document.getElementById('page');
pageEl.addEventListener('mousemove', function () {
	typeof moveCounter !== 'undefined' ? moveCounter++ : 0;
});
document.body.addEventListener('mouseleave', function (el) {
	moveCounter = 0;
});

/** Обработка событий календаря */
window.onChangeCld = function (adjuster) {
	app.cld.onChangeCld(adjuster);
}
window.onChangeMonth = async function (month) {
	app.cld.onChangeMonth(month);
}
window.onChangeYear = async function (year) {
	app.cld.onChangeYear(year);
}
