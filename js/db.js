export { DB as default };

class DB {

	constructor(app) {
		this.app = app;
		//this.router = app.router;
	}

	async fillDb(isAwait) {
		
		if (this.app.stateContainer.updateInfo.updateStarted)
			return;
		this.app.stateContainer.updateInfo = {
			updateStarted: true
		};


		// 'https://cors-anywhere.herokuapp.com/http://otk-data.website.yandexcloud.net'
		const url = 'https://publish-dt.github.io/otk-data/exp'; // 'data'; // 

		const serviceDwld = await download(url + '/service.json');
		if (serviceDwld) {
			const serviceData = await db.settings.get('serviceData');

			const res = await fillInfos(serviceDwld, serviceData, url, this.app, isAwait);
			await fillFiles(serviceDwld, serviceData, url, this.app);
			await fillQuote(serviceDwld, serviceData, url, this.app);

			if (!isAwait && Object.keys(res).length > 0 && (res.numberNewData > 0 || res.numberChangeData > 0))
				alert(`Загружено: ${res.numberNewData} новых материалов и ${res.numberChangeData} изменённых материалов`);
		}
		else {
			if (netOffline) alert('Нет подключения к интернету!');
			else alert('Не удалось загрузить данные из otk-data');
		}

		this.app.stateContainer.updateInfo.updateStarted = false;
	}
}

async function fillInfos(serviceDwld, serviceData, url, app, isAwait) {
	const res = {};

	const lastDateChange = new Date(serviceDwld.LastDateChange);
	const lastDateChangeStore = (serviceData === undefined || serviceData.LastDateChange === undefined ? new Date(0, 0, 0) : new Date(serviceData.LastDateChange));
	if (serviceData === undefined || lastDateChange > lastDateChangeStore) {
		let nameZip = serviceData === undefined || Math.round((lastDateChange - lastDateChangeStore) / (1000 * 60 * 60 * 24)) >= 7 ? "full" : "last";

		// это только для отладки
		// необходимо установить точку останова на const updated = await db.settings.update..., и после остановки в этой точке в консоли браузера выполнить: serviceDwld.LastDateChange = "2026-09-23T11:36:32.006+03:00" , где дата соответствует последней дате из full.json
		/*if (nameZip === 'full') url = '/data';
		else nameZip = 'full';*/

        try {
			const files = await downloadAndUnzip(url + `/${nameZip}.zip`);
			if (files !== undefined && files.length > 0) {
				let lastTolk = JSON.parse(localStorage.getItem('lastTolk'));
				let lastPoem = JSON.parse(localStorage.getItem('lastPoem'));
				const lastTolkStore = lastTolk;
				const lastPoemStore = lastPoem;

				for (var i in files) {
					const file = files[i];

					console.log(`Загрузка материалов из ${file.name} в БД...`);

					let counter = 0;
					let numberNewData = 0;
					let numberChangeData = 0;
					let jsonString = undefined;
					//const toDelete = [];
					const arrData = file.content.split('\n');
					for (var i in arrData) {
						try {

							jsonString = arrData[i];
							if (jsonString !== "") {
								const obj = JSON.parse(jsonString);

								const dateChange = new Date(obj.DateChange);
								const date = new Date(obj.Date);
								if (obj.Active === true && (dateChange > lastDateChangeStore || (lastPoemStore && obj.Id === lastPoemStore.Id) || (lastTolkStore && obj.Id === lastTolkStore.Id))) { // это новый/изменённый материал или последний Катрен/Послание, это нужно, чтобы старые и не изменённые материалы не пересохранять в БД
									let isFound = false;
									await db.infos.where("Id").equalsIgnoreCase(obj.Id).modify((value, ref) => { // изменяем существующую запись в БД
										ref.value = obj;
										isFound = true;
									});

									if (isFound) { // это изменённый материал
										if (lastPoemStore && obj.Id !== lastPoemStore.Id && lastTolkStore && obj.Id !== lastTolkStore.Id) { // Последний Катрен/Послание не должен учитываться в списке изменённых материалов, т.к. в нём меняется только Data.Next
											console.log('Изменённый материал: ' + obj.Link);
											numberChangeData++;
										}
									}
									else { // это новый материал
										await db.infos.add(obj);
										if (serviceData && serviceData.LastDateChange) console.log('Новый материал: ' + obj.Link);
										numberNewData++;
									}

									// обновляем кэш данных последнего Катрена/Послания
									if (obj.Catalog === app.catalogs.poems && (!lastPoem || obj.Date > lastPoem.Date || obj.Id === lastPoem.Id)) {
										obj.Description = '';
										lastPoem = obj;
									}
									else if (obj.Catalog === app.catalogs.tolk && (!lastTolk || obj.Date > lastTolk.Date || obj.Id === lastTolk.Id)) {
										obj.Description = '';
										lastTolk = obj;
									}

									counter++;
								}
								else if (serviceData && serviceData.LastDateChange && obj.Active === false && dateChange > lastDateChangeStore) {
									//toDelete.push(obj.Id);
									await db.infos.delete(obj.Id);
								}
							}

						} catch (e) {
							console.error('Ошибка при парсинге и добавлении материала в БД', e);
						}
					}
					console.log(`Загружено ${counter} материалов`);

					// кэшируем основные данные последнего Катрена и Послания
					if (lastPoem) localStorage.setItem('lastPoem', JSON.stringify(lastPoem));
					if (lastTolk) localStorage.setItem('lastTolk', JSON.stringify(lastTolk));

					if (!isAwait) // serviceData === undefined
						app.router.navigateToPath(app.getPath(location.href));

					res.numberNewData = numberNewData;
					res.numberChangeData = numberChangeData;
				}
			}

			console.log('Загрузка материалов в БД завершена');

			const updated = await db.settings.update('serviceData', { LastDateChange: serviceDwld.LastDateChange });
			if (!updated) {
				const objServ = { name: 'serviceData' };
				objServ.LastDateChange = serviceDwld.LastDateChange;
				await db.settings.add(objServ);
			}
		} catch (e) {
			console.error(e);
        }
	}

	return res;
}

async function fillFiles(serviceDwld, serviceData, url, app) {

	for (var i in serviceDwld.InfoFiles) {

		const lastDateChange = new Date(serviceDwld.InfoFiles[i]);
		const lastDateChangeStore = (serviceData === undefined || serviceData.InfoFiles === undefined || serviceData.InfoFiles[i] === undefined ? new Date(0, 0, 0) : new Date(serviceData.InfoFiles[i]));
		if (serviceData === undefined || lastDateChange > lastDateChangeStore) {
			const nameZip = i;

			// это только для отладки
			//url = '/data';

            try {
				const files = await downloadAndUnzip(url + `/files/${nameZip}.zip`, true);
				if (files !== undefined && files.length > 0) {
					for (var j in files) {

						const file = files[j];

						console.log(`Запись файла ${file.name} в кэш браузера...`);

						const cache = await caches.open("cnt");

						const blob = new Blob([file.content], {
							type: 'image/jpeg', // application/octet-stream
							ok: true,
							status: 200
						});
						const headers = new Headers({
							'content-length': blob.size
						});
						const response = new Response(blob, {
							headers
						});

						await cache.put(`/cnt/${i}/${file.name}`, response); // new Request(`/cnt/${i}/${file.name}`)

					}
				}
				else {
					const keys = await cache.keys();
					keys.forEach(request => {
						if (request.url.includes(`/cnt/${i}/`)) {
							cache.delete(request.url);
							console.log('Удалён кэш для: ', request.url);
                        }
					});
				}

				console.log(`Запись файлов в кэш браузера завершена`);

				const updated = await db.settings.update('serviceData', { [`InfoFiles.${i}`]: serviceDwld.InfoFiles[i] });
				if (!updated) {
					const objServ = { InfoFiles: {}, name: 'serviceData' };
					objServ.InfoFiles[i] = serviceDwld.InfoFiles[i];
					await db.settings.add(objServ); //  { [nameProp]: serviceDwld.InfoFiles[i], name: 'serviceData' }
				}
            } catch (e) {

            }
		}
    }
}

async function fillQuote(serviceDwld, serviceData, url, app) {
	const LastNumberQuote = serviceDwld.LastNumberQuote;
	const LastNumberQuoteStore = (serviceData === undefined ? 0 : serviceData.LastNumberQuote);
	if (serviceData === undefined || LastNumberQuote !== LastNumberQuoteStore) {
		try {
			const files = await downloadAndUnzip(url + '/quote.zip');
			if (files !== undefined && files.length > 0) {
				for (var i in files) {
					const file = files[i];

					console.log(`Загрузка цитат из ${file.name} в БД...`);

					let numberNewData = 0;
					let jsonString = undefined;
					const arrData = file.content.split('\n');
					for (var i in arrData) {
                        try {
							jsonString = arrData[i];
							if (jsonString !== "") {
								const obj = JSON.parse(jsonString);

								// это только для отладки
								// необходимо установить точку останова на const updated = await db.settings.update..., и после остановки в этой точке в консоли браузера выполнить: serviceDwld.LastNumberQuote = 99 , где 99 соответствует последнему номеру из quote.json
								// && obj.Number < 100
								if (!obj.Deleted && obj.Number > LastNumberQuoteStore) { // это новая цитата 
									await db.quote.add(obj);
									if (serviceData !== undefined) console.log('Новая цитата из: ' + obj.Link);
									numberNewData++;
                                }
							}
						} catch (e) {
							console.error('Ошибка при парсинге и добавлении цитаты в БД', e);
                        }
					}
				}
			}

			console.log(`Загрузка цитат в БД завершена`);

			const updated = await db.settings.update('serviceData', { LastNumberQuote: serviceDwld.LastNumberQuote });
			if (!updated) {
				const objServ = { name: 'serviceData' };
				objServ.LastNumberQuote = serviceDwld.LastNumberQuote;
				await db.settings.add(objServ);
			}
		} catch (e) {
			console.error(e);
		}
	}
}

async function downloadAndUnzip(url, isFile) {
	try {
		if (url !== undefined) {

			console.log(`Скачивание архива ${url} ...`);

			const response = await fetch(url);
			if (!response.ok) throw new Error('Ошибка загрузки архива');

			console.log('Архив скачан');

			console.log('Распаковка архива...');

			const arrayBuffer = await response.arrayBuffer();

			const zip = new JSZip();
			const unzipped = await zip.loadAsync(arrayBuffer);

			// Обрабатываем содержимое архива
			const files = [];

			//for (const [filename, file] of Object.entries(unzipped.files)) {
			for (const filename in unzipped.files) {
				const file = unzipped.files[filename];
				if (!file.dir) { // Пропускаем папки
					const content = await file.async(isFile ? 'arraybuffer' : 'string');

					files.push({
						name: filename,
						content: content
					});
				}
			}

			return files;
		}
	} catch (error) {
		console.error(`Ошибка при скачивании ${url}:`, error);
	}
}
			
async function download(url) {
	try {
		if (url !== undefined) {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`Ошибка загрузки ${url}`);

			const data = await response.json();

			return data;
		}
	} catch (error) {
		console.error(`Ошибка при скачивании ${url}:`, error);
	}
}
