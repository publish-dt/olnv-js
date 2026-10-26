export { Router as default };

class Router {
    constructor(app) {
        this.app = app;
    }

    async navigateToPath(path, firstLoad, targetEl) {

        let count = 0;
        let cnt = '';
        let isNext = false;
        let posNext = -1;
        let state = {};
        let documentTitle = undefined;
        let hash = '';
        let modelSearch;

        const newTab = targetEl ? targetEl.target === '_blank' : false;

        if (path !== '') {
            let prePage = '';
            let lastDict = '';
            let lastPoem = '';

            try {
                // получаем значение хэша/якоря
                const arrPath = path.split('#');
                if (arrPath.length > 1) hash = arrPath[1];
                path = arrPath[0];

                // Получаем дату из path
                const datePath = getDateFromPath(path);
                let monthCld;
                let yearCld;
                if (datePath) {
                    monthCld = datePath.getMonth();
                    yearCld = datePath.getFullYear();
                }
                this.app.cld.getDataCalendar(yearCld, monthCld);

                // получаем настройки роутинга
                let params = {};
                let route = { ByLink: true };
                for (var k in this.app.routes) {
                    if (this.app.routes[k].Route.includes(path)) {
                        route = this.app.routes[k];
                        break;
                    }
                    for (var n in this.app.routes[k].Route) {
                        const el = this.app.routes[k].Route[n];
                        const idx = el.indexOf('{');
                        if (idx !== -1) {
                            const prefixPath = path.substring(0, idx);
                            if (prefixPath === el.substring(0, idx)) {
                                const paramVal = path.substring(idx);
                                const paramArr = el.slice(idx + 1, -1).split(':');
                                const paramName = paramArr[0];
                                const type = paramArr[1];
                                switch (type) {
                                    case 'int':
                                        const number = Number(paramVal);
                                        if (!Number.isNaN(number)) {
                                            params[paramName] = number;
                                            params.prefixPath = prefixPath;
                                        }
                                        break;
                                    default:
                                }
                                if (Object.keys(params).length > 0) break;
                            }
                        }
                    }
                    if (Object.keys(params).length > 0) {
                        route = this.app.routes[k];
                        break;
                    }
                }

                if (path.startsWith('cnt/')) {
                    const cachedResponse = await cache.match('/' + path);
                    if (cachedResponse) {
                        const blob = await cachedResponse.blob();
                        const base64 = await blobToBase64(blob);

                        const imgCnt = `<img src="${base64}" style="display: block;-webkit-user-select: none;margin: auto;background-color: hsl(0, 0%, 90%);transition: background-color 300ms;">`;
                        if (newTab) cnt = imgCnt;
                        else document.body.innerHTML = imgCnt;
                    }
                }
                // Это страница поиска
                else if (path.startsWith('search?')) {
                    const res = await this.app.search.renderSearch(path);
                    if (res) {
                        cnt = res.cnt;
                        documentTitle = res.title;
                    }
                }
                else {

                    /** Получение последнего Послания */
                    let lastTolkStore = this.app.stateContainer.lastTolk;// JSON.parse(localStorage.getItem('olnvjs_lastTolk'));
                    const infoLastDict = lastTolkStore ? lastTolkStore :
                    await db.infos
                        .orderBy('Date')
                            .filter((info) => info.Catalog === this.app.catalogs.tolk)
                        .last();

                    /** Получение последнего Катрена */
                    let lastPoemStore = this.app.stateContainer.lastPoem;// JSON.parse(localStorage.getItem('olnvjs_lastPoem'));
                    const infoLastPoems = lastPoemStore ? lastPoemStore :
                    await db.infos
                        .orderBy('Date')
                            .filter((info) => info.Catalog === this.app.catalogs.poems)
                        .last();


                    // Это главная страница
                    if (path === 'index') {
                        const options = {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        };

                        //const infoLastDict = infosDict[0];
                        if (infoLastDict) {
                            const dateLastDict = strToDate(infoLastDict.Date);
                            lastDict = `<a href='/${infoLastDict.Link}.html'>Последнее Послание</a> (от ${dateLastDict.toLocaleDateString("ru-RU", options)})`;
                        }

                        //const infoLastPoems = infosPoems[0];
                        if (infoLastPoems) {
                            const dateLastPoem = strToDate(infoLastPoems.Date);
                            lastPoem = `<a href='/${infoLastPoems.Link}.html'>Последний Катрен</a> (от ${dateLastPoem.toLocaleDateString("ru-RU", options)})`;
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
                        let routeVal = route.ByLink ? path : (route.Catalogs ? route.Catalogs[0] : undefined);

                        let infos;
                        if (routeVal) {
                            let coll = db['infos']
                                .where(routeBy)
                                .equalsIgnoreCase(routeVal);

                            const isLastYear = path.endsWith('year');
                            if (!isLastYear && route.ParamView && route.ParamView[0] || (isLastYear && route.Catalogs.includes(this.app.catalogs.tolk))) coll = coll;
                            else coll = coll.desc();
                            if (route.ParamView && route.ParamView.length > 1 && route.ParamView[1] === 'year') {
                                const isPoems = route.Catalogs.includes(this.app.catalogs.poems) ? true : (route.Catalogs.some(el => [this.app.catalogs.dict, this.app.catalogs.tolk].includes(el)) ? false : undefined);
                                params.isPoems = isPoems;
                                params.lastYear = strToDate((isPoems ? infoLastPoems.Date : infoLastDict.Date)).getFullYear();
                                const yearFilter = isLastYear ? params.lastYear : params.year;
                                if (isLastYear) {
                                    params.year = yearFilter;
                                    params.prefixPath = path.replace('year', '');
                                }
                                coll = coll.and((info) => info.Date.includes(yearFilter));
                            }
                            if (path === 'otkroveniya') {
                                params.year = 2004;
                                params.isPoems = false;
                                params.lastYear = strToDate(infoLastDict.Date).getFullYear();
                            }
                            params.isLastYear = isLastYear;

                            infos = !route.ByLink ? await coll.sortBy('Date') : await coll.toArray();
                        }

                        if (location.pathname.endsWith('search')) {
                            if (targetEl.dataset.msuPagesearch && (new Boolean(targetEl.dataset.msuPagesearch))) modelSearch = this.app.stateContainer.modelSearch;
                            else this.app.stateContainer.modelSearch = {};
                        }

                        let res;
                        if (route.View)
                            res = await this.app.views[`render${route.View}`](route, infos, path, params);
                        else
                            res = await this.renderView(path, infos, cnt, prePage, lastDict, lastPoem, route, modelSearch);

                        if (res) {
                            cnt = res.cnt;
                            state.title = res.title;
                            documentTitle = res.title;
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }

        let settings;
        try {
            settings = await db.settings.get('serviceData'); //undefined;
        } catch (e) {
            console.error(e);
        }
        let cntIsSet = false;
        if (cnt === '') {
            if (settings !== undefined || !this.app.stateContainer.updateInfo.updateStarted)
                cnt = '<p style="color: red">Информация не найдена!</p>';
        }
        else cntIsSet = true;

        if (cntIsSet) {
            if (documentTitle && path !== 'index') documentTitle = documentTitle;
            else documentTitle = this.app.appName;

            if (newTab) {
                /*var divEl = document.createElement('div');
                divEl.innerHTML = cnt;
                var newTab = window.open('', documentTitle); // , features
                newTab.document.body.appendChild(divEl);*/
                var newWindow = window.open('', documentTitle);

                if (newWindow) {
                    // Наполняем новую вкладку содержимым
                    newWindow.document.write(`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="css/lib/bootstrap.min.css" />
    <link rel="stylesheet" type="text/css" href="css/style.css">
    <title>${documentTitle}</title>
</head>
<body>
    <div id="page" class="page">
        <section id="general" class="page_section">
            <div class="container-fluid">
                <div class="row">
                    <main>
                        <div id="main-cont" class="col-lg-12 col-md-12 col-sm-12 col-xs-12 page-main">
                            ${cnt}
                        </div>
                    </main>
                </div>
            </div>
        </section>
    </div>
    <script>
        window.onload = function () {
            window.mainContEl = document.getElementById('main-cont');

            const hash = '${hash}';
            if (hash) {
                const hashEl = document.getElementsByName(hash);
                if (hashEl.length > 0) hashEl[0].scrollIntoView();
            }

            //console.log('test 1');
            //debugger;
            const path = '/' + '${this.app.basePath + (path === 'index' ? '' : (path + (!path.startsWith('search?') ? '.html' : ''))) + (hash ? '#' + hash : '')}';
            //alert(path);
            history.pushState({}, '', path);
        };
    <\/script>
</body>
</html>
                    `);

                    // Закрываем поток записи документа
                    newWindow.document.close();

                    // Помечаем заголовок элемента в результате поиска, как просмотренный
                    if (modelSearch && Object.keys(modelSearch).length > 0) {
                        let titleEl = targetEl;
                        if (targetEl.firstChild.nodeName !== "#text") titleEl = targetEl.firstChild;
                        titleEl.setAttribute('style', 'color: peru !important;');
                        const value = path + (hash ? `#${hash}` : '');
                        if (Array.isArray(modelSearch.viewedList)) {
                            if (!modelSearch.viewedList.includes(value)) modelSearch.viewedList.push(value);
                        }
                        else modelSearch.viewedList = [value];
                    }
                }
            }
            else {

                if (path !== 'index' && !path.startsWith('search?')) {
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
                    <p id="signature" class="poslan-link">(<a href="/${quote.Link}.html">Послание от ${quote.Link.substring(quote.Link.indexOf('/') + 1)}</a>, стих ${quote.Para})</p>
                    `;
                }

                /*if (documentTitle && path !== 'index') document.title = documentTitle;
                else document.title = this.app.appName;*/
                document.title = documentTitle;
            }
        }

        if ((settings !== undefined || !this.app.stateContainer.updateInfo.updateStarted) && !newTab)
            mainContEl.innerHTML = cnt;

        state.path = path;
        state.hash = hash;

        if (hash) {
            let hashEl = document.getElementsByName(hash);
            if (hashEl.length > 0) hashEl[0].scrollIntoView();
            //window.location.hash = hash;
        }
        else if (!firstLoad && !newTab)
            window.mainContEl.scrollIntoView(); //window.scroll(0, 0);

        state = posNext !== -1 && !isNext ? undefined : state;
        if (!newTab) this.app.setHistory(state);

        return state;
    }

    async renderView(path, infos, cnt, prePage, lastDict, lastPoem, route, modelSearch) {
        let listDouble = [];
        const info = infos[0];
        const res = {};

        if (info) {
            const title = route.Title ? route.Title : infos[0].Titles[0];
            res.title = title;

            const isNoDate = info.Catalog === this.app.catalogs.infos || info.Catalog === this.app.catalogs.notices || info.Catalog === this.app.catalogs.dict || info.Link === '2004/predislovie';
            const match = !isNoDate ? info.Link.match(/^.*\/(?<date>\d{2}-\d{2}\.\d{2}\.\d{2})$/) : undefined;
            const dateStr = isNoDate ? '' : (match && match.groups ? match.groups.date : toShortMoscowDate.format(strToDate(info.Date)));
            cnt += `<h1 class="page-title">${dateStr ? '<span class="date">'+dateStr+'</span> ' : ''}${title}</h1>`;

            for (var j in infos) {
                const info = infos[j];

                cnt += await this.renderContent(info, lastDict, lastPoem, modelSearch);

                if (route.ByLink) break;
                else listDouble.push(path);
            }

            if (info.Link !== 'index') {

                cnt += this.app.views.renderFooter(info, '', '.html', prePage);

            }

            if (route.ByLink && listDouble.length > 1) {
                console.error(`Вместо одного найдено ${count} элемента! (${listDouble})`);
            }
        }

        res.cnt = cnt;

        return res;
    }

    async renderContent(info, lastDict, lastPoem, modelSearch) {
        let cnt = undefined;
        let desc = info.Description;

        if (info.Link === 'index') {
            desc = desc.replace('{{$lastdict}}', lastDict).replace('{{$lastpoem}}', lastPoem);
            try {
                let regexp = RegExp('(.*)(<h2>Разное<\/h2>)', 'gis');
                let match = regexp.exec(desc);
                desc = match[0];
            } catch (e) {
            }
        }

        // подсвечиваем найденную фразу
        if (modelSearch && Object.keys(modelSearch).length > 0) {
            const searchOptions = "g" + (modelSearch.widthCASE ? '' : 'i');
            desc = desc.replace(RegExp(modelSearch.patternHightlight, searchOptions), "<span class='hightlight'>" + modelSearch.sectionHightlight + "</span>");
        }

        cnt = `<div class="razdel poem-blok">${desc}</div>`;
        if (info.Link === 'index') cnt += `<div class="cont"><a href="settings.html">Настройки</a></div>`; //  onclick="clearAllData()"

        // Галлерея
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

                        cnt += `
                                <a href="cnt/${info.Id}/${file.Path}" target="_blank">
                                    <img src="${base64}" height="120" alt="Изображение" />
                                </a>
                                `;
                    }
                }
            }
            cnt += '<!-- //gallery block -->';
        }

        if (!info.Data.NoFooter)
            cnt += `<p class="date-footer">${(toShortMoscowDate.format(strToDate(info.Date)))}</p>`;

        return cnt;
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