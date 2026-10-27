export { Views as default };

class Views {

	constructor(app) {
		this.app = app;
	}

    renderInfoList(route, infos, path, params) {
        const res = {};
        let cnt = '';
        if (infos.length > 0) {
            const isLastYear = path.endsWith('year');
            const title = route.Title + (params.year ? `${params.year} год` : '');

            const isTolk = route.Route.includes('tolkovaniya');
            const maxColumn = isTolk ? 2 : 1;
            const numCol = 12 / maxColumn;

            cnt += `<h1 class="page-title">${title}</h1>
                <div class="container-fluid">
            `;

            /** Группировка по месяцам или годам */
            const grouped = {};
            for (var x in infos) {
                const info = infos[x];
                info.Description = undefined; // чтобы не переполнять память
                const date = strToDate(info.Date);
                const year = date.getFullYear();
                const groupName = '_'+(isTolk ? (info.Link === '2004/31.12.04' ? 2005 : year) : date.getMonth());

                if (!grouped[groupName]) {
                    grouped[groupName] = [];
                }
                if (params.isPoems && params.isLastYear) grouped[groupName].unshift(info);
                else grouped[groupName].push(info);
            }


            for (var key in grouped) {
                const group = grouped[key];
                const i = Number(key.slice(1));
                if (group.length > 0) {
                    let counter = 0;
                    let iColumn = 1;
                    const lengthAll = group.reduce((sum, item) => sum + item.Titles.length, 0);
                    //const lengthAll = group.length + countTitles;
                    const countBr = lengthAll > 30 ? Math.ceil((lengthAll / maxColumn)) : 0; // количество записей в списке при котором необходимо делать перенос на вторую колонку
                    const numbColumn = countBr > 0 ? maxColumn : 1;

                    let preDay = 0;
                    const numbGroup = parseInt(i, 10);
                    const groupName = isTolk ? (`Книга ${intToRoman(numbGroup - 2000 - 3)}, ${i} год`) : (getMonthName(numbGroup) + ` ${params.year} года`);

                    cnt += '<div class="razdel row">';
                    if (!isTolk || (isTolk && numbGroup !== 2004)) cnt += `<h2>${groupName}</h2>`;
                    cnt += `<div class="col-lg-${numCol} col-md-${numCol} col-sm-12 col-xs-12 col-tolk">`;

                    for (var j in group) {
                        const info = group[j];
                        const date = strToDate(info.Date);
                        const num = date.getDate();
                        const number = ('0' + num).slice(-2);
                        for (var k in info.Titles) {
                            const itemTitle = info.Titles[k];
                            const nameEl = itemTitle.replace("<nobr>", "").replace("</nobr>", "") + (params.isPoems ? ` (от ${toShortMoscowDate.format(date)})` : '');

                            const prefix = !isTolk && !params.isPoems ? (preDay === num ? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' : number + ': ') : '';
                            preDay = num;

                            cnt += `<a href="${info.Link}.html">${prefix}${nameEl}</a><br />`;

                            counter++;

                            /** Перенос в следующую колонку */
                            if (countBr != 0 && counter % countBr == 0 && iColumn != numbColumn) {
                                cnt += `</div><div class="col-lg-${numCol} col-md-${numCol} col-sm-12 col-xs-12 col-tolk">`;

                                iColumn++;
                            }
                        }
                    }

                    cnt += '</div></div>';
                }
            }
            cnt += '</div>';

            const lastNumber = params.lastYear;
            const firstNumber = params.isPoems ? 2016 : 2004;
            const curPosition = params.year;
            if ((lastNumber - firstNumber) > 1) {
                const resPag = this.renderPagination({}, params.prefixPath, '.html', curPosition, firstNumber, lastNumber, 0, `${params.isPoems ? 'Катрены' : 'Послания'} за `, ', ', 'год', true);
                cnt += resPag.cnt;
            }

            const prePage = curPosition - 1;
            const nextPage = curPosition + 1;
            cnt += this.renderFooter(undefined, params.prefixPath, '.html', prePage >= firstNumber ? (prePage === firstNumber && !params.isPoems ? 'otkroveniya' : prePage) : '', nextPage <= lastNumber ? (nextPage === lastNumber ? 'year' : nextPage) : '');

            res.tite = title;
        }
        res.cnt = cnt;

        return res;
    }

    renderPagination(queryParams, prefixPath, suffixPath, curPosition, firstNumber, lastNumber, maxPaginSeries, prefixSeries, betweenSeries, postfixSeries, numberAsPath, typeContent, paginTpl) {
        let renderPagination = "";
        let prePage;
        let nextPage;


        //const entries = Object.keys(queryParams).map(key => [key, queryParams[key]]);
        const paramsArr = [];
        Object.keys(queryParams).forEach(key => { if (key != "PageIndex") paramsArr.push(`${key}=${queryParams[key]}`); });
        const query = paramsArr.length > 0 ? ("?" + paramsArr.join("&")) : "";
        prefixPath = prefixPath || "";
        suffixPath = suffixPath || "";
        curPosition = curPosition || 1;
        firstNumber = firstNumber || 1;
        lastNumber = lastNumber || 1;

        const max = maxPaginSeries; /// максимальное количество отображаемых чисел в ряде
        const leftOfCur = max > 0 ? Math.ceil(max / 2) : 0;
        const rightOfCur = leftOfCur;

        const start = 1;
        const baseNumber = firstNumber - start;
        const pagesCount = lastNumber - firstNumber + 1;
        const curPage = curPosition - baseNumber;

        const countLeft = max > 0 && (pagesCount - curPage) <= leftOfCur ? max - 1 - (pagesCount - curPage) : leftOfCur - 1;
        const countRight = max > 0 && max - curPage >= rightOfCur ? max + 1 - curPage : rightOfCur;

        renderPagination += `
            <div class='pagin' >
                ${ prefixSeries }`;
        for (let i = start; i <= pagesCount; i++)
        {
            const number = baseNumber + i;
            if (max == 0 || (i >= curPage - countLeft && i < (curPage + countRight)) || i == 1 || i == pagesCount) {
                if (curPosition !== number) {
                    var path = prefixPath + (numberAsPath ? (number === 2004 ? 'otkroveniya' : (number === lastNumber ? 'year' : number)) : "") + suffixPath + (query && !numberAsPath ? `${query}&PageIndex=${number}` : "");

                    if (curPosition - 1 === number) prePage = path;
                    if (curPosition + 1 === number) nextPage = path;

                    renderPagination += paginTpl ? paginTpl(number)
                        : `<a href='${path}' ${(typeContent === 'search' ? "data-msu-pagsearch='true'" : "")}>${number}${(number !== lastNumber ? betweenSeries : "")}</a>`;
                }
                else
                    renderPagination += `<span>${number}</span>`;
            }
            else if ((i === (curPage - countLeft - 1) && i !== 1) || (i === (curPage + countRight) && i !== pagesCount)) {
                renderPagination += "<text>...</text>";
            }
        }
        renderPagination += `
        ${ postfixSeries }
            </div>`;

            
        const cnt = renderPagination;

        return { cnt: cnt, prePage: prePage, nextPage: nextPage };
	}

    renderFooter(info, prefixPath, suffixPath, prePage, nextPage) {

        let cnt = '<div class="page-footer">';

        if (prePage && ((info && this.app.catalogsIsNext.includes(info.Catalog)) || !info)) {
            cnt += `<a href="${prefixPath}${prePage}${suffixPath}" class="blue-link-pagination">Предыдущая</a>
                <img src="img/star.gif" height="15" hspace="10" width="15">`
        }

        cnt += `<button onclick="window.mainContEl.scrollIntoView();" class="btn-link blue-link-pagination">В начало страницы</button>`;

        let linkNext = nextPage;
        if (info && this.app.catalogsIsNext.includes(info.Catalog)) {
            linkNext = info.Data.Next;
            if (!info.Data.Next) {
                linkNext = info.Link + '-next';
            }
        }
        if (linkNext) {
            cnt += `<img src="img/star.gif" height="15" hspace="10" width="15">
                <a href="${prefixPath}${linkNext}${suffixPath}" class="blue-link-pagination">Следующая</a>`;
            if (info && !info.Data.Next) {
                cnt += '<span id="label-next" title="Следующей страницы ещё может не быть"> [*]</span><span id="spinner-next" class="bi-spinner"></span>';
            }
        }

        cnt += '</div>';

        return cnt;
    }

    renderSettings(route, infos, path, params) {
        const title = route.Title;
        let cnt = `<h1 id='pageTitle' class='page-title'>${title}</h1>`;
        cnt += `
        <ul class="settings">
            <li>Фоновое изображение (“звёздное небо”):<input type="checkbox" onchange="OnOffStarsBg(!this.checked)" ${window.app.settings.isOffStarsBg ? '' : 'checked'} style="width: 40px;"></li>
            <li>Url для обновления информации: <input id="set-domain" onblur="setDomain(this)" oninput="setDomainInput(this)" value="${window.app.settings.urlUpdate ? this.app.settings.urlUpdate : ''}" style="width: 320px;" title="Альтернативный URL для получения новой информации (например: https://example.com/data/exp)"></li>
            <li>Удалить все материалы: <button type="button" onclick="clearAllData()" class="btn btn-danger" title="На данном компьютере, удаляет из базы данных всю ранее загруженную информацию (это может понадобиться, если необходимо заново загрузить все материалы)">Удалить</button></li>
            <li>Версия приложения: ${window.verApp}</li>
            <li>Режим отладки: <input type="checkbox" onchange="OnOffDebug(this.checked)" ${window.app.settings.isOnDebug ? 'checked' : ''} style="width: 40px;"></li>
        </ul>
        `;
        return { title: title, cnt: cnt };
    }
}