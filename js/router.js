export { Router as default };

class Router {
    constructor(app) {
        this.app = app;
    }

    async navigateToPath(path) {

        let count = 0;
        let cnt = '';
        let isNext = false;
        let posNext = -1;
        let state = {};

        if (path !== '') {
            //let regexp = new RegExp(path);
            let prePage = '';
            let lastDict = '';
            let lastPoem = '';

            let route = { ByLink: true };
            for (var k in this.app.routes) {
                if (this.app.routes[k].Route.includes(path)) {
                    route = this.app.routes[k];
                    break;
                }
            }

            if (path.startsWith('cnt/')) {
                //const cache = await caches.open("cnt");

                /*caches.match('/cnt/6488a42d9231157cf9aaf9f1/Image00001.jpg').then(response => {
                    if (response) {
                        // Use the cached response
                    } else {
                        // Fetch from network
                    }
                });*/
                const cachedResponse = await cache.match('/' + path);
                if (cachedResponse) {
                    const blob = await cachedResponse.blob();
                    const base64 = await blobToBase64(blob);

                    document.body.innerHTML = `<img src="${base64}" style="display: block;-webkit-user-select: none;margin: auto;background-color: hsl(0, 0%, 90%);transition: background-color 300ms;">`;
                    /*var newTab = window.open();
                    newTab.document.body.innerHTML = `<img src="${base64}">`;*/
                }
            }
            else {

                // Это главная страница
                if (path === 'index') {
                    const options = {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    };

                    // Получение последнего Послания
                    let lastTolkStore = JSON.parse(localStorage.getItem('lastTolk'));
                    const infoDict = lastTolkStore ? lastTolkStore :
                    await db.infos
                        .orderBy('Date')
                        .filter((info) => info.Catalog === '55d6a586b6b9a45a700f9eee')
                        /*.where('Catalog')
                        .equalsIgnoreCase('55d6a586b6b9a45a700f9eee')*/
                        //.limit(1)
                        //.desc()
                        //.sortBy('Date');
                        //.toArray();
                        .last();

                    //const infoDict = infosDict[0];
                    if (infoDict) {
                        const dateLastDict = new Date(infoDict.Date);
                        lastDict = `<a href='/${infoDict.Link}.html'>Последнее Послание</a> (от ${dateLastDict.toLocaleDateString("ru-RU", options)})`;
                    }

                    // Получение последнего Катрена
                    let lastPoemStore = JSON.parse(localStorage.getItem('lastPoem'));
                    const infoPoems = lastPoemStore ? lastPoemStore :
                    await db.infos
                        .orderBy('Date')
                        .filter((info) => info.Catalog === '570ef2fcd07cda3e16f93ef7')
                        /*.where('Catalog')
                        .equalsIgnoreCase('570ef2fcd07cda3e16f93ef7')
                        .desc()
                        .sortBy('Date');*/
                        .last();

                    //const infoPoems = infosPoems[0];
                    if (infoPoems) {
                        const dateLastPoem = new Date(infoPoems.Date);
                        lastPoem = `<a href='/${infoPoems.Link}.html'>Последний Катрен</a> (от ${dateLastPoem.toLocaleDateString("ru-RU", options)})`;
                    }
                }

                posNext = path.indexOf('-next');
                if (posNext !== -1) {

                    // Получение указанного материала для получения ссылки на следующий материал
                    path = path.substring(0, posNext);

                    const infos = await db['infos']
                        .where('Link')
                        .equalsIgnoreCase(path)
                        .toArray();

                    const info = infos[0];
                    if (info.Data.Next) {
                        isNext = true;
                        prePage = path;
                        path = info.Data.Next;
                        console.log('Найден новый материал (при переходе к [*]): ' + path);
                    }
                    else { // нового материала ещё нет

                        // Получение ссылки на предыдущий материал
                        await db['infos']
                            .where('Data.Next')
                            .equalsIgnoreCase(path)
                            .each((info) => {
                                prePage = info.Link;
                            });

                        //cnt = await this.renderContent(info, cnt, prePage, lastDict, lastPoem);
                        const res = await this.renderView(path, infos, cnt, prePage, lastDict, lastPoem, route);
                        cnt = res.cnt;
                        state.title = res.title;
                    }
                }
                else {
                    // Получение ссылки на предыдущий материал
                    await db['infos']
                        .where('Data.Next')
                        .equalsIgnoreCase(path)
                        .each((info) => {
                            prePage = info.Link;
                        });
                }

                // Получение указанного или нового материала
                if (isNext || posNext === -1) {

                    let routeBy = route.ByLink ? 'Link' : 'Catalog';
                    let routeVal = route.ByLink ? path : route.Catalogs[0];
                    /*if (path === 'novosti') {
                        routeBy = 'Catalog';
                        routeVal = this.app.catalogs.notices;
                        infoIsList = true;
                    }*/

                    const coll = db['infos']
                        .where(routeBy)
                        .equalsIgnoreCase(routeVal);
                        //.filter((info) => regexp.test(info.Link))
                        /*.desc()
                        .sortBy('Date');*/
                        //.toArray();
                        //.and((info) => regexp.test(info.Link))
                        /*.each(async (info) => {
                        });*/

                    const infos = !route.ByLink ? await coll.desc().sortBy('Date') : await coll.toArray();

                    const res = await this.renderView(path, infos, cnt, prePage, lastDict, lastPoem, route);
                    cnt = res.cnt;
                    state.title = res.title;
                }

            }
        }

        const settings = await db.settings.get('serviceData'); //undefined;
        let cntIsSet = false;
        if (cnt === '') {
            //settings = await db.settings.get('serviceData');
            if (settings !== undefined)
                cnt = '<p style="color: red">Информация не найдена!</p>';
        }
        else cntIsSet = true;

        if (cntIsSet) {
            mainContEl.innerHTML = cnt;

            if (path !== 'index') {
                let bookmarks = await dbApp.settings.get('bookmarks');
                if (!bookmarks) bookmarks = {};
                bookmarks['#lastPage#'] = path;
                //bookmarks[state.title] = path;
                dbApp.settings.upsert('bookmarks', bookmarks);
            }

            // выводим цитату
            const max = settings && settings.LastNumberQuote ? settings.LastNumberQuote : 0;
            if (max) {
                const quote = await db.quote.get(getRandomInt(max));
                quoteBlockEl.innerHTML = `
                <p>Слова Создателя:</p>
                <p class="poslan-quote">${quote.Description}</p>
                <p id="signature" class="poslan-link">(<a href="/${quote.Link}.html">Послание от ${quote.Link.substring(quote.Link.indexOf('/')+1)}</a>, стих ${quote.Para})</p>
                `;
            }
        }

        state.path = path;

        return posNext !== -1 && !isNext ? undefined : state;
    }

    async renderContent(info, lastDict, lastPoem) {
        let cnt = undefined;
        let desc = info.Description;

        if (info.Link === 'index') {
            desc = desc.replace('{{$lastdict}}', lastDict).replace('{{$lastpoem}}', lastPoem);
        }

        cnt = `<div class="razdel poem-blok">${desc}</div>`;
        if (info.Files && info.Files.length > 0) {
            cnt += '<!--gallery block-->';
            for (var i in info.Files) {
                const file = info.Files[i];
                if (file) {

                    let base64 = undefined;
                    const cachedResponse = await cache.match(`/cnt/${info.Id}/${file.Path}`);
                    if (cachedResponse) {
                        const blob = await cachedResponse.blob();
                        const base64 = await blobToBase64(blob);

                        cnt += `<a href="/cnt/${info.Id}/${file.Path}" target="_blank">
                                    <img src="${base64}" height="120" alt="Изображение" />
                                </a>`;
                        /*let reader = new FileReader();
                        reader.readAsDataURL(blob);

                        reader.onload = function () {
                            base64 = reader.result;
                            //  src="/cnt/${info.Id}/${file.Path}" onLoad="handleImgLoad(this)"
                            cnt += `<a href="/cnt/${info.Id}/${file.Path}" target="_blank">
                                        <img src="${base64}" height="120" alt="Изображение" />
                                    </a>`;
                        };*/
                    }
                }
            }
            cnt += '<!-- //gallery block -->';
        }

        if (!info.Data.NoFooter)
            cnt += `<p class="date-footer">${(new Date(info.Date)).toLocaleDateString("ru-RU", optShortDate)}</p>`;

        return cnt;
    }


    async renderView(path, infos, cnt, prePage, lastDict, lastPoem, route) {
        let listDouble = [];
        const info = infos[0];
        const res = {};

        if (info) {
            const title = route.Title ? route.Title : infos[0].Titles[0];
            res.title = title;

            cnt += `<h1 class="page-title"><span class="date">${(new Date(info.Date)).toLocaleDateString("ru-RU", optShortDate)}</span> ${title}</h1>`;

            for (var j in infos) {
                const info = infos[j];

                cnt += await this.renderContent(info, lastDict, lastPoem);

                if (route.ByLink) break;
                else listDouble.push(path);
            }

            if (info.Link !== 'index') {

                cnt += '<div class="page-footer">';

                if (prePage && this.app.catalogsIsNext.includes(info.Catalog)) {
                    cnt += `<a href="/${prePage}.html" class="blue-link-pagination">Предыдущая</a>
                    <img src="/img/star.gif" height="15" hspace="10" width="15">`
                }

                cnt += `<button onclick="window.mainContEl.scrollIntoView();" class="btn-link blue-link-pagination">В начало страницы</button>`;

                if (this.app.catalogsIsNext.includes(info.Catalog)) {
                    let linkNext = info.Data.Next;
                    if (!info.Data.Next) {
                        linkNext = info.Link + '-next';
                    }
                    cnt += `<img src="/img/star.gif" height="15" hspace="10" width="15">
                    <a href="/${linkNext}.html" class="blue-link-pagination">Следующая</a>`;
                    if (!info.Data.Next) {
                        cnt += '<span title="Следующей страницы ещё может не быть"> [*]</span>';
                    }
                }

                cnt += '</div>';

            }
            else
                cnt += `</br><a href="#" onclick="if (confirm('Очистить базу данных?')) {db.delete();localStorage.clear();caches.delete('cnt');}">Настройки</a>`;

            if (route.ByLink && listDouble.length > 1) {
                console.error(`Вместо одного найдено ${count} элемента! (${listDouble})`);
            }
        }

        res.cnt = cnt;

        return res;
    }
}


function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

function getRandomInt(max) {
    const min = 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}