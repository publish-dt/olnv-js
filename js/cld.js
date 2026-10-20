export { Cld as default };

class Cld {

    constructor(app) {
        this.app = app;

        this.minCldYear = app.configApp.minYear;
    }

	buildCalendar() {
        const lastPoemDate = strToDate(this.app.stateContainer.lastPoem.Date);
        const lastTolkDate = strToDate(this.app.stateContainer.lastTolk.Date);
        this.maxCldYear = lastPoemDate > lastTolkDate ? lastPoemDate.getFullYear() : lastTolkDate.getFullYear();
        this.maxCldMonth = lastPoemDate > lastTolkDate ? lastPoemDate.getMonth() : lastTolkDate.getMonth();
        /*const curDate = new Date();
        this.curCldMonth = curDate.getMonth() + 1;
        this.curCldYear = curDate.getFullYear();

        this.getDataCalendar(this.curCldYear, this.curCldMonth - 1);*/

        const selectYear = document.getElementById('cld-year');
        for (var i = this.minCldYear; i <= this.maxCldYear; i++) {
            const option = new Option(i, i);
            selectYear.add(option);
        }
    }

    async getDataCalendar(year, month) {
        if (!year || !month) {
            month = this.maxCldMonth;
            year = this.maxCldYear;
        }
        if (year < this.app.configApp.minYear || (year === this.curCldYear && month === this.curCldMonth-1)) return;
        const spinnerEl = document.getElementById('spinner-cld');
        spinnerEl.style.display = 'inline-block';
        const cldTitleEl = document.getElementById('cld-title');
        cldTitleEl.innerHTML = '';
        this.curCldMonth = month+1;
        this.curCldYear = year;

        const dateEnd = /*HelpersG.AnyToMoscow*/(new Date(year, month, 1));
        const dateStart = new Date(dateEnd);
        dateEnd.setMonth(dateEnd.getMonth() + 1);

        const daysData = [];
        const infos = await db['infos']
            .where('Catalog')
            .anyOf([this.app.catalogs.dict, this.app.catalogs.tolk, this.app.catalogs.poems])
            .and((info) => strToDate(info.Date) >= dateStart && strToDate(info.Date) < dateEnd)
            .sortBy('Date'); // надо обязательно сортировать по дате, чтобы Послания были в приоритете
            /*.each(async (info) => {
                const data = {
                    Date: formatDateCld(strToDate(info.Date)),
                    Type: info.Data && info.Data.PoemOutDict ? 'poemOutDict' : (info.Catalog === this.app.catalogs.dict || info.Catalog === this.app.catalogs.tolk ? 'dict' : 'poem'),
                    Link: info.Link + '.html',
                    Title: null
                };
                daysData.push(data);
                //console.log(data);
            }).then(() => {
                cldTitleEl.innerHTML = `${months[month]} ${year} года`;
                //console.log("daysData:" + daysData.length);
                const newDate = new Date(year, month);
                CldEl.innerHTML = '';
                caleandar(CldEl, daysData, {}, newDate);
                spinnerEl.style.display = 'none';
            }).catch(err => {
                console.error(err);
            });*/

        /** Группируем по дате, т.к. может быть несколько разных типов материалов в одной дате (Послания, Катрены, спец. даты) */
        const grouped = [];
        for (var i in infos) {
            const info = infos[i];

            const groupName = formatDateCld(strToDate(info.Date));

            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            grouped[groupName].push(info);
        }

        for (var key in grouped) {
            const group = grouped[key];

            if (group && group.length > 0) {
                const infoMess = group.find(info => info.Catalog === this.app.catalogs.dict || info.Catalog === this.app.catalogs.tolk);
                const infoPoem = group.find(info => info.Catalog === this.app.catalogs.poems);
                const data = {
                    Date: key,
                    Type: group.some(info => info.Data && info.Data.PoemOutDict) ? 'poemOutDict' : (infoMess ? 'dict' : 'poem'),
                    Link: (infoMess ? infoMess.Link : (infoPoem ? infoPoem.Link : 'notLinkCld')) + '.html',
                    Title: null
                };
                daysData.push(data);
            }
        }

        cldTitleEl.innerHTML = `${months[month]} ${year} года`;
        //console.log("daysData:" + daysData.length);
        const newDate = new Date(year, month);
        CldEl.innerHTML = '';
        caleandar(CldEl, daysData, {}, newDate);
        spinnerEl.style.display = 'none';

    }

    async onChangeCld(adjuster) {
        const date = new Date(this.curCldYear, this.curCldMonth + adjuster - 1, 1);
        const month = date.getMonth();
        const year = date.getFullYear();

        const yearExist = false;
        if (year >= this.minCldYear && year <= new Date().getFullYear()) { // проверяем, можно ли стрелками месяца перейти к след./пред. году, поскольку список годов ограничен
            await this.changeCalendar(month + 1, year);
        }
    }

    async onChangeMonth(month) {
        const yearEl = document.getElementById('cld-year');
        const year = parseInt(yearEl.value);
        if (year !== -1) {
            await this.changeCalendar(parseInt(month), year);

            const monthEl = document.getElementById('cld-month');
            yearEl.value = -1;
            monthEl.value = -1;
        }
    }

    async onChangeYear(year) {
        const monthEl = document.getElementById('cld-month');
        const month = parseInt(monthEl.value);
        if (month !== -1) {
            await this.changeCalendar(month, parseInt(year));

            const yearEl = document.getElementById('cld-year');
            yearEl.value = -1;
            monthEl.value = -1;
        }
    }

    async changeCalendar(month, year) {
        if (this.curCldYear != year || this.curCldMonth != month) {
            //GetDataAjax(year + "-" + month + ".json");
            //htmx.trigger('#api-ext-cld', "msu-ext-cld", { replaceEndPath: year + "-" + month + ".json" });
            //CldProcess(year + "-" + ("0" + month).slice(-2));
            await this.getDataCalendar(year, month-1);
        }
    }
}