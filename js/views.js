export { Views as default };

class Views {

	constructor(app) {
		this.app = app;
	}

    renderPagination(queryParams, prefixPath, suffixPath, curPosition, firstNumber, lastNumber, maxPaginSeries, prefixSeries, betweenSeries, postfixSeries, numberAsPath, typeContent, paginTpl) {
        let renderPagination = "";

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

        let prePage;
        let nextPage;

        renderPagination += `
            <div class='pagin' >
                ${ prefixSeries }`;
        for (let i = start; i <= pagesCount; i++)
        {
            const number = baseNumber + i;
            if (max == 0 || (i >= curPage - countLeft && i < (curPage + countRight)) || i == 1 || i == pagesCount) {
                if (curPosition !== number) {
                    var path = prefixPath + (numberAsPath ? number : "") + suffixPath + (query && !numberAsPath ? `${query}&PageIndex=${number}` : "");

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


        const cnt = renderPagination + this.renderFooter(undefined, postfixSeries, prePage, nextPage);

        return cnt;
	}

    renderFooter(info, postfixSeries, prePage, nextPage) {

        let cnt = '<div class="page-footer">';

        if (prePage && ((info && this.app.catalogsIsNext.includes(info.Catalog)) || !info)) {
            cnt += `<a href="/${prePage}${postfixSeries}" class="blue-link-pagination">Предыдущая</a>
                <img src="/img/star.gif" height="15" hspace="10" width="15">`
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
            cnt += `<img src="/img/star.gif" height="15" hspace="10" width="15">
                <a href="/${linkNext}${postfixSeries}" class="blue-link-pagination">Следующая</a>`;
            if (info && !info.Data.Next) {
                cnt += '<span title="Следующей страницы ещё может не быть"> [*]</span>';
            }
        }

        cnt += '</div>';

        return cnt;
    }
}