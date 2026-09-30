export { Search as default };

class Search {

	constructor(app) {
		this.app = app;
	}

    async Run(searchString, where) {
        console.log(`Начат поиск по фразе '${searchString}'`);

        let catalogsSearch = [];
        let collName = 'infos';
        let propSearch = 'Description';
        switch (where) {
            case 'Mess':
                catalogsSearch = [this.app.catalogs.dict, this.app.catalogs.tolk];
                break;
            case 'Poems':
                catalogsSearch = [this.app.catalogs.poems];
                break;
            case 'Titles':
                propSearch = 'Titles';
                break;
            case 'Site':
                break;
            case 'Date':
                propSearch = 'Date';
                // может не правильно искать, т.к. есть смещение зоны, т.е. текстовая дата может быть другой, т.е. надо преобразовать в дату с учётом зоны
                searchString = (new Date(searchString)).toISOString().replace('z', '');
                break;
            case 'Quote':
                collName = 'quote';
                break;
            default:
        }

        /*const coll = db['infos']
            .where('Catalog')
            .anyOf(catalogsSearch)
            //.orderBy('Date')
            .filter((info) => (new RegExp(`${searchString}`, 'gim')).test(info.Description))
            /*.and((info) => catalogsSearch.includes(info.Catalog))
            .toArray();*/
            /*.desc()*/
            //.sortBy('Date');
            /*.each(async (info) => {
            });*/

        let coll = undefined;
        if (catalogsSearch.length) coll = db[collName].where('Catalog').anyOf(catalogsSearch);
        else coll = db[collName];
        if (propSearch !== 'Titles') coll = coll.filter((info) => (new RegExp(searchString, 'gim')).test(info[propSearch])) // нужно обязательно здесь делать new RegExp иначе неправильные результаты - https://github.com/dexie/Dexie.js/issues/1405?ysclid=muod2qrm235706232?ysclid=muod2qrm235706232
        else coll = coll.filter((info) => {
            const index = info.Titles.findIndex(str => str.toLowerCase().includes(searchString.toLowerCase()));
            return index !== -1 ? true : false;
        });

        const startTime = new Date();
        const infos = await coll.sortBy('Date');
        const endTime = new Date();

        for (var i in infos) {
            const info = infos[i];

            console.log('Найдено: ' + (info.Titles ? info.Titles[0] : info.Link));
        }

        console.log(`Поиск по фразе '${searchString}' окончен! Найдено ${infos.length} материалов. Заняло: ${endTime - startTime}`);
	}
}