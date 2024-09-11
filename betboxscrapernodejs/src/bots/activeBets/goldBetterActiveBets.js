const { getActiveBets } = require('../../utils/activeBetsUtils');
const { goldBetterLogin, acceptGoldBetterCookies } = require('../../utils/goldBetterUtils');
const {delay} = require("../../utils/botUtils");

async function getGoldBetterActiveBets(site) {
    return getActiveBets(site, {
        siteLogin: goldBetterLogin,
        acceptCookies: acceptGoldBetterCookies,
        navigateToActiveBets: async (page) => {
            await page.click('div.conto a span.material-icons');
            console.log("Clicked account button");
            await page.click('span.fa-stack i.material-icons-outlined');
            console.log("Clicked bets button");
            await delay (4000,5000);
        },
        selectTimePeriod: async (page) => {
            await page.click('mat-select[name="periodo"]');
            await page.waitForSelector('mat-option');
            await page.click('mat-option:has-text("7 giorni")');
            await page.click('button:has-text("Cerca")');
            console.log("Selected '7 days' period and clicked 'Search'");
            await delay(1500, 2000);
        },
        getBetElements: async (page) => {
            return page.$$('tbody[role="rowgroup"] > tr');
        },
        extractBetDetails: async (page, betElement) => {
            const date = await betElement.$eval('td:first-child .lh-2', el => el.textContent.trim());

            await betElement.click();
            await page.waitForSelector('.dialog-content', { visible: true, timeout: 5000 });

            return page.evaluate(({site, date}) => {
                const importoGiocato = document.querySelector('.top-row-info.light-bg span:last-child')?.textContent.trim() || '';
                const esitoTotale = document.querySelector('.top-row-info.short span:last-child')?.textContent.trim() || '';
                const quotaTotale = document.querySelector('.quotation span:last-child')?.textContent.trim() || '';
                const vincitaPotenziale = document.querySelector('.potential-win span:last-child')?.textContent.trim() || '';

                const events = Array.from(document.querySelectorAll('.dialog-content tbody[role="rowgroup"] > tr')).map(eventRow => {
                    const dateString = eventRow.querySelector('.container-date-fixed .date')?.textContent?.trim() || '';
                    const [datePart, timePart] = dateString.split(' ');
                    const [day, month, year] = datePart.split('/');
                    const date = new Date(`${year}-${month}-${day}T${timePart}`);
                    const dotElement = eventRow.querySelector('.dot');
                    let result = '';
                    if (dotElement) {
                        if (dotElement.classList.contains('yellow')) result = 'In corso';
                        else if (dotElement.classList.contains('green')) result = 'Vinto';
                        else if (dotElement.classList.contains('red')) result = 'Perso';
                    }

                    return {
                        date: date.getTime(),
                        competition: eventRow.querySelector('.sport')?.textContent?.trim() || '',
                        name: eventRow.querySelector('.game')?.textContent?.trim() || '',
                        marketType: eventRow.querySelector('td.mat-column-Scommessa .lh-2')?.textContent?.trim() || '',
                        selection: eventRow.querySelector('.d-inline-block:nth-child(2) .lh-2')?.textContent?.trim() || '',
                        odds: eventRow.querySelector('td.mat-column-Quota .lh-2')?.textContent?.trim() || '',
                        result: result,
                        matchResult: "N/A"
                    };
                });

                const latestEventDate = new Date(Math.max(...events.map(e => e.date)));
                const betId = date.replace(/[/:\s]/g, '') + quotaTotale.replace('.', '');

                return {
                    site: site,
                    date: date,
                    betId: betId,
                    importoGiocato: importoGiocato,
                    esitoTotale: esitoTotale,
                    quotaTotale: quotaTotale,
                    vincitaPotenziale: vincitaPotenziale,
                    events: events,
                    latestEventDate: latestEventDate
                };
            }, {site, date});
        },
        closeBetDetails: async (page) => {
            await page.click('mat-icon.close-icon');
        }
    });
}

module.exports = { getGoldBetterActiveBets };
