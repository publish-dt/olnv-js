export { Search as default };

class Search {

	constructor(app) {
        this.app = app;
        this.m_PageSize = 15;
	}

    async renderSearch(query) {
        const queryParams = {};
        const queryArr = query.substring(query.indexOf('?') + 1).split('&');
        for (const key in queryArr) {
            const data = queryArr[key].split('=');
            queryParams[data[0]] = data[1];
            /*if (queryArr[key].startsWith('SearchString=')) {
                queryParams['SearchString'] = queryArr[key].split('=')[1];
            }
            else if (queryArr[key].startsWith('Where=')) {
                queryParams['Where'] = queryArr[key].split('=')[1];
            }*/
        }
        let searchString = queryParams['SearchString'];
        const where = queryParams['Where'];

        searchString = decodeURIComponent(searchString);
        if (!searchString || !where) return;
        console.log(`Начат поиск по фразе '${searchString}'`);

        let advError = undefined;

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
                const splitter = searchString.indexOf('.') !== -1 ? '.' : '/';
                try {
                    let [day, month, year] = searchString.split(splitter).map(String);
                    if (year && year.length === 2) year = '20' + year;
                    if (!year) year = '';
                    if (month.startsWith('20')) {
                        year = month;
                        month = day;
                        day = '';
                    }
                    if (isNaN(new Date(year, month - 1, day))) throw 'Формат даты не распознан.'; // это только для проверки даты
                    /*// может не правильно искать, т.к. есть смещение зоны, т.е. текстовая дата может быть другой, т.е. надо преобразовать в дату с учётом зоны
                    const dateUTC = new Date(Date.UTC(year, month - 1, day)); //new Date(year, month - 1, day);
                    const isoDate = dateUTC.toISOString()
                    searchString = isoDate.substring(0, isoDate.indexOf('T'));*/
                    searchString = `${year}-${month}-${day}`; // T - не надо, т.к. поиск по ММ.20ГГ не будет выполнен, кроме того когда будет без учёта регистра .toLowerCase(), то 'T' будет маленькой
                } catch (e) {
                    console.error('Формат даты не распознан.');
                    advError = `
                        <p>Формат даты не распознан.</p>
                        <p>Дата должна быть указана в одном из следующих форматов:<br><strong>ДД.ММ.20ГГ<br>ДД.ММ.ГГ<br>ДД.ММ<br>ММ.20ГГ</strong></p>
                        <p>Разделителем групп цифр может быть точка или наклонная черта (<strong>/</strong>).</p>
                    `;
                }
                break;
            case 'Quote':
                collName = 'quote';
                break;
            default:
        }

        const searchData = this.app.stateContainer.modelSearch;// { where: where, searchString: searchString, pageIndex: queryParams['PageIndex'] ? queryParams['PageIndex'] : 1, widthCASE: false };
        searchData.where = where;
        searchData.searchString = searchString;
        searchData.pageIndex = queryParams['PageIndex'] ? queryParams['PageIndex'] : 1;
        searchData.widthCASE = false;
        searchData.patternHightlight = '';
        searchData.sectionHightlight = '';

        // обрабатываем * в поисковой фразе
        var startWord = /*modelSearch.StartEndWord == 1 || modelSearch.StartEndWord == 2 ? "\\b" :*/ "";
        var endWord = /*modelSearch.StartEndWord == 1 ? "\\b" :*/ "";

        var arrSearchString = searchString.split(" * ");
        for (let i = 0; i < arrSearchString.length; i++)
        {
            if (arrSearchString[i]) {
                var matchTrimed = arrSearchString[i].match(/(\w+\W*)+\b/); // обрезаем вначале и в конце фразы все символы пунктуации
                if (matchTrimed) arrSearchString[i] = matchTrimed[0].replace(/[^\w*]/, "\W") // внутри фразы заменяем все символы (кроме *) пунктуации на регулярное выражение \W
                    .replace("*", "\w*"); // это для поиска слов (внутри фразы) с произвольным окончанием

                arrSearchString[i] = startWord + arrSearchString[i] + endWord;

                searchData.patternHightlight += (searchData.patternHightlight ? "|(" : "(") + arrSearchString[i] + ")";
                searchData.sectionHightlight += "$" + (i + 1);
            }
        }
        searchString = arrSearchString.join(".*");

        let infos = [];
        if (!advError) {
            searchString = searchString;//.toLowerCase();

            let coll = undefined;
            if (catalogsSearch.length) coll = db[collName].where('Catalog').anyOf(catalogsSearch);
            else coll = db[collName];
            if (propSearch === 'Titles') coll = coll.filter((info) => {
                const index = info.Titles.findIndex(str => str/*.toLowerCase()*/.includes(searchString));
                return index !== -1 ? true : false;
            });
            else if (propSearch === 'Date') {
                if (searchString.startsWith('-'))
                    coll = coll.filter((info) => info.Date.indexOf(searchString) > -1);
                    //coll = coll.filter((info) => (new RegExp(searchString, 'gim')).test(info[propSearch]));
                else coll = coll.where(propSearch).startsWith(searchString);
            }
            else
                coll = coll.filter((info) => (new RegExp(searchString, 'gim')).test(info[propSearch])); // нужно обязательно здесь делать new RegExp иначе неправильные результаты - https://github.com/dexie/Dexie.js/issues/1405?ysclid=muod2qrm235706232?ysclid=muod2qrm235706232
                //coll = coll.filter((info) => info[propSearch]/*.toLowerCase()*/.indexOf(searchString) > -1); // RegExp работает быстрее

            const startTime = new Date();
            infos = await coll.sortBy('Date'); //  
            const endTime = new Date();

            console.log(`Поиск по фразе '${searchString}' окончен! Найдено ${infos.length} материалов. Заняло: ${endTime - startTime}`);
        }

        const dataView = this.prepareDataView(infos, searchData);
        const res = await this.renderView(dataView, advError, queryParams);

        //this.app.stateContainer.modelSearch = searchData;

        return res;
    }

    prepareDataView(infos, searchData) {
        const patternHightlight = searchData.searchString;// (searchData.InParagraph ? searchData.searchString : searchData.patternHightlight) || "";

        const skip = (searchData.pageIndex - 1) * this.m_PageSize;
        const limit = this.m_PageSize;

        const dataView = searchData;
        dataView.itemCount = infos.length;
        dataView.elementsView = [];

        if (skip === 0) infos.length = limit;
        else infos = infos.slice(skip, skip+limit); // infos.length

        /*infos.each(_info => {
        });*/
        for (var i in infos) {
            const _info = infos[i];

            dataView.elementsView.push(this.renderContent(_info, searchData, patternHightlight));
        }

        return dataView;
    }

    async renderView(dataView, advError, queryParams) {
        const title = 'Результаты поиска';
        const res = {};
        const elementsView = dataView.elementsView;
        //const modelSearch = this.app.stateContainer.modelSearch;

        const itemCount = dataView.itemCount;
        let whereText = await this.getHeaderTextParams(dataView.where, itemCount);

        let cnt = `<h1 id='pageTitle' class='page-title'>${title}</h1>
            <div id='res'>
            <div id='msg-search'>
            <p>
            <span>Вы искали ${whereText[0]} ${(dataView.where !== 'Date' ? "фрагмент " : "")}“<strong>${dataView.searchString}</strong>”.</span><br />`;

        cnt += itemCount > 0 ?
            (dataView.where !== 'Date' ?
                `<span>Поиск выполнен без учёта знаков препинания${(dataView.widthCASE ? "" : " и регистра букв")}.</span>
                <br />
                <span>Найдены соответствия ${whereText[1]} </span>
                `
                : ("Найден" + getDeclension(itemCount, "а", "о", "о")) + '&nbsp;'
            )
            + `<strong>${itemCount}</strong> ${whereText[2]}.<br />`
            : (!advError ?
                `К сожалению, ничего не найдено.<br /><br />${((dataView.searchString.includes("*")) ? "Символ звёздочки (*) можно использовать только между словами через пробел (в этом случае заменяет любое количество слов или ни одного). Например: 'микро * фрактал'<br /><br />" : "")}`

                + (dataView.where != 'Date' ? `
                Возможно, вы ошиблись в написании одного из слов. Если вы не помните точно, как пишется слово, введите ту его часть, в написании которой вы уверены.
                <br />
                Действующая версия поискового модуля выполняет так называемый контекстный поиск, то есть поиск в точном соответствии с указанным порядком и окончаниями слов.
                <br />
                Поэтому, если вы ввели в строку поиска более одного слова, попробуйте уменьшить количество слов или изменить окончания у некоторых слов и повторите поиск.
                <br />
                ` : "")
                : advError);

        cnt += '</p></div>'

        const countPaginPages = Math.ceil(itemCount / this.m_PageSize);

        if (itemCount > 0) {
            cnt += "<div id='res-search' class='search-res-blok'>";
            for (var i in elementsView) {
                const info = elementsView[i];
                //console.log('Найдено: ' + (info.Titles ? info.Titles[0] : info.Link));
                if (info) {

                    cnt += `<div class="search-res-el">
                            <div>
                                <a target='_blank' href='${(!info.Link ? (info.Catalog === this.app.catalogs.notices ? "novosti.html" : "") : info.Link + ".html")}'
                                ${dataView && dataView.viewedList && dataView.viewedList.includes(info.Link) ? " style='color: peru!important;'" : "" }
                                data-msu-pagesearch='true'
                                >
                                    ${(dataView.where === 'Quote' ? "Послание от " : "") + info.Name.replace("<br>", "").replace("<br />", "")}
                                </a>`;
                                cnt += ((info.Catalog == this.app.catalogs.poems || info.Catalog == this.app.catalogs.dict || info.Catalog == this.app.catalogs.tolk) ?
                                    `<span> (
                                        ${(info.Catalog == this.app.catalogs.poems ? "Катрен" : "Послание")} от ${(new Date(info.Date)).toLocaleDateString("ru-RU", optShortDate) }
                                        ${ (info.Catalog == this.app.catalogs.dict || info.Catalog == this.app.catalogs.tolk ? ", книга " + intToRoman(((new Date(info.Date)).getFullYear() - 2000 - 3)) : "")}
                                    )</span>`
                                : (
                                    dataView.where !== 'Quote' ?
                                        `<span> (
                                            ${(info.Catalog == this.app.catalogs.notices ? "Объявление от "
                                            : (info.Catalog == this.app.catalogs.infos ? ""
                                            : (this.app.catalogsName[info.Catalog] + " от ")))}
                                            ${(new Date(info.Date)).toLocaleDateString("ru-RU", optShortDate)}
                                        )</span>`
                                    : ""
                                    )
                                );
                    cnt += `</div>
                            ${(dataView.where !== 'Date' && info.Description ?
                                "<div>"+info.Description+"</div>" : ""
                            )}
                        </div>
                    <div class='hr'><!----></div></div><!--/search-res-blok-->`;
                }
            }

            cnt += countPaginPages > 1 ?
                `<!-- Пагинация -->
                    <div id='pagin-search' class='search-pagin-blok'>
                    ${this.app.views.renderPagination(queryParams, 'search', '', Number(queryParams['PageIndex']), 1, countPaginPages, 10, "Страницы результатов: ", '', '', false, 'search')}
                    </div><!--/search-pagin-blok-->`
                : '';
        }

        res.title = title;
        res.cnt = cnt;

        return res;
    }

    renderContent(_info, searchData, patternHightlight) {
        let elementView = undefined;

        let descript = _info.Description;
        let link = _info.Link;
        let para = _info.Para;
        let titles = _info.Titles;
        let date = anyToMoscow(_info.Date);
        let catalog = _info.Catalog;

        let info = { Description: descript, Link: link, Para: para, Titles: titles, Date: date, Catalog: catalog, NameView: (titles && titles.length > 0 ? titles[0].replace("<nobr>", "").replace("</nobr>", "") : "") };

        if (info.Link.includes("index")) return; // из результатов поиска исключаем страницу index

        const searchOptions = "g" + (searchData.widthCASE ? '' : 'i');
        let description = "";
        if (searchData.where !== 'Date') {
            let desc = info.Description.replace(/[\n\r]+/g, "");

            let matches;
            let regexp;
            if (searchData.where == 'Titles') regexp = RegExp('<div class="next">(?<title>.*?)<\/div>', searchOptions);// desc.matchAll(RegExp('<div class="next">(?<title>.*?)<\/div>', searchOptions));
            else if (searchData.where == 'Quote') regexp = RegExp("^(?<para>.*)", searchOptions); // matches = desc.matchAll(RegExp("(?<para>.*)", searchOptions));
            else regexp = RegExp('(?:<p.*?>(?<para>.*?)<\/p>)|(?:<div class="next">(?<title>.*?)<\/div>)', searchOptions);// matches = desc.matchAll(RegExp('(?:<p.*?>(?<para>.*?)<\/p>)|(?:<div class="next">(?<title>.*?)<\/div>)', searchOptions));
            let subTitle = "";

            let itemMatch;
            //for (const itemMatch of matches) {
            while (itemMatch = regexp.exec(desc)) {
                if (itemMatch.groups["title"]) {
                    const titleValue = itemMatch[0];
                    const isMatch = RegExp(patternHightlight, searchOptions).test(titleValue);
                    if (searchData.where !== 'Titles' || (searchData.where === 'Titles' && isMatch)) {
                        //const subTitleMatch = itemMatch.groups["title"].matchAll(RegExp('name="(?<number>\.)".*<\/a>(?<title>.*)', searchOptions));
                        const subTitleMatch = RegExp('name="(?<number>\.)".*<\/a>(?<title>.*)', searchOptions).exec(itemMatch.groups["title"]);
                        //const subTitleMatchItems = Array.from(subTitleMatch);
                        const numb = subTitleMatch.groups["number"];
                        const subTitleText = subTitleMatch.groups["title"].replace(/<(\/)?h1>/g, "");

                        const highlight = searchData.patternHightlight ? subTitleText.replace(RegExp(searchData.patternHightlight, searchOptions), "<span class='hightlight'>" + searchData.sectionHightlight + "</span>") : subTitleText; // подсвечиваем найденную фразу
                        subTitle = `<a target="_blank" href='${(!info.Link ? "" : info.Link + ".html#") + numb}'>
                        <h4${searchData && searchData.viewedList && searchData.viewedList.includes(info.Link + '#' + numb) ? " style='color: peru!important;'" : ""}
                        data-msu-pagesearch='true'
                        >` + highlight + "</h4></a>";

                        if (searchData.where === 'Titles'
                            || ((searchData.where === 'Mess' || searchData.where === 'Poems' || searchData.where === 'Site') && isMatch)
                        )
                        {
                            description += subTitle;
                        }
                    }
                }
                else if (searchData.patternHightlight && RegExp(patternHightlight, searchOptions).test(itemMatch[1]))
                {
                    if (itemMatch.groups["para"]) {
                        const paraValue = itemMatch[0];
                        const highlight = paraValue.replace(RegExp(searchData.patternHightlight, searchOptions), "<span class='hightlight'>" + searchData.sectionHightlight + "</span>"); // подсвечиваем найденную фразу
                        if (searchData.where !== 'Quote')
                            description += (subTitle ? subTitle : "") + highlight.replace("text-align:right;", "");
                        else
                            description += info.Para + ". " + highlight.replace(/<br>/g, " ").replace(/<br \/>/g, " ");

                        subTitle = "";
                    }
                }
            }
        }

        if (description || searchData.where == 'Date' || searchData.where == 'Titles')
        {
            var title = searchData.patternHightlight ? info.NameView.replace(RegExp(searchData.patternHightlight, searchOptions), "<span class='hightlight'>" + searchData.sectionHightlight + "</span>") : info.NameView;

            elementView = { Name: !title ? (info.Link ? info.Link.split("/") : ['',''])[1] : title, Catalog: info.Catalog || "", Date: info.Date, Link: info.Link, Description: description };
        }
        else
        {
            /// сюда мы могли попасть, например, когда искомая фраза нашлась (например "основан * религии"), поиск ведётся в пределах абзаца, но слова из искомой фразы находятся не в пределах одного азаца
        }

        return elementView;
    }

    async getHeaderTextParams(where, itemCount) {
        let whereText = ["", ""];
        switch (where) {
            case 'Mess':
                whereText = ["в Посланиях", "в", "Послани" + getDeclension(itemCount, "и", "ях", "ях")];
                break;
            case 'Poems':
                whereText = ["в Катренах", "в", "Катрен" + getDeclension(itemCount, "е", "ах", "ах")];
                break;
            case 'Titles':
                whereText = ["в заголовках", "в", "заголовк" + getDeclension(itemCount, "е", "ах", "ах")];
                break;
            case 'Site':
                whereText = ["по всему Сайту", "на", "страниц" + getDeclension(itemCount, "е", "ах", "ах")];
                break;
            case 'Date':
                whereText = ["материалы за дату", "", "страниц" + getDeclension(itemCount, "а", "ы", "")];
                break;
            case 'Quote':
                whereText = ["в цитатах", "в", "цитат" + getDeclension(itemCount, "е", "ах", "ах")];
                break;
            default:
        }

        return whereText;
    }
}