import DB from './db.js';
import Router from './router.js';
import StateContainer from './state.js';
import Search from './search.js';
import Views from './views.js';

class App {
	constructor() {
		this.appName = 'Откровения людям Нового века';
		this.router = new Router(this);
		this.myDB = new DB(this);
		this.search = new Search(this);
		this.views = new Views(this);

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

		// для управления состоянием приложения
		this.stateContainer = new StateContainer();
	}

	async init() {

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

		window.mainContEl = document.getElementById('main-cont');
		window.quoteBlockEl = document.getElementById('quote-block');
		window.formEl = document.getElementById('search');
		window.percentUpdatedEl = document.getElementById('percent-updated');

		const isExist = await Dexie.exists('OtkDB');
		if (!isExist)
			createDB();

		this.myDB.fillDb();


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
					//window.mainContEl.scrollIntoView(); //window.scroll(0, 0);
					//this.setHistory(state);
				} catch (e) {
					console.error(e);
				}
            }
		}
	}
	else if (targetEl.type === "button") {
		app.myDB.fillDb();
    }
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
