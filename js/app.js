import DB from './db.js';
import Router from './router.js';
import StateContainer from './state.js';
import Search from './search.js';

class App {
	constructor() {
		this.appName = 'Откровения людям Нового века';
		this.router = new Router(this);
		this.myDB = new DB(this);
		this.search = new Search(this);

		this.catalogs = {
			dict: '618028f53fbe9a7a22fa9e82',
			tolk: '55d6a586b6b9a45a700f9eee',
			poems: '570ef2fcd07cda3e16f93ef7',
			notices: '5eeb5170ee6d7619745b6675',
			infos: "569d8556d07cda0a2b222693"
		};
		this.catalogsIsNext = [ // список ID каталогов, по которым можно перемещаться вперёд/назад
			this.catalogs.dict,
			this.catalogs.tolk,
			this.catalogs.poems
		];
		this.routes = [
			{
				//Name: "ОБЪЯВЛЕНИЯ",
				//ToMenu: true,
				Catalogs: [
					this.catalogs.notices
				],
				ByLink: false,
				Route: ["novosti"],
				Title: "Новости и объявления"
			}
		];

		// для управления состоянием приложения
		this.stateContainer = new StateContainer();
	}

	async init() {

		this.myDB.fillDb();
		console.log(`В базе: ${await db.infos.count()} материалов`);

		window.mainContEl = document.getElementById('main-cont');
		window.quoteBlockEl = document.getElementById('quote-block');
		window.formEl = document.getElementById('search');

		// получаем последнюю открытую пользователем страницу
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
		const state = await this.router.navigateToPath(path);
		if (pathChanged && state.path !== 'index') history.pushState(state, '', `/${state.path}.html`);
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
}

window.db = new Dexie('OtkDB');
db.version(1).stores({
	infos: 'Id, Link, Data.Next, Catalog, Date',
	quote: '++Number',
	settings: 'name' 
});

window.dbApp = new Dexie('OtkApp');
dbApp.version(1).stores({
	settings: 'name'
});

caches.open('cnt')
	.then(cache => window.cache = cache);


const app = new App();
app.init();

window.onclick = async function (event) {
	const url = event.target.href;

	if (url !== undefined) {
		const arrPath = url.split('/');
		if (location.host === arrPath[2]) {
			event.preventDefault(); // нужно размещать обязательно перед fillDb, иначе fetch не сработает

			let path = app.getPath(url);
            if (path !== '#') {
				if (path.endsWith('-next')) {
					await app.myDB.fillDb(true);
				}
				try {
					const state = await app.router.navigateToPath(path);
					window.mainContEl.scrollIntoView(); //window.scroll(0, 0);
					if (state) {
						history.pushState(state, '', '/' + app.basePath + (state.path === 'index' ? '' : `${state.path}.html`));
					}
				} catch (e) {
					console.error(e);
				}
            }
		}
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

window.addEventListener('submit', function (event) {
	event.preventDefault();

	const searchString = formEl.querySelector('#searchString').value;
	const where = formEl.querySelector('#where').value;

	//console.log('Форма отправлена!' + searchString);
	app.search.Run(searchString, where);
});
