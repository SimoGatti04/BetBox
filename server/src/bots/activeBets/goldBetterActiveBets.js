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
            await delay(4000, 5000);
        },
        selectTimePeriod: async (page) => {
            await page.$eval(`xpath=//mat-form-field[.//mat-label[contains(text(), 'Tipologia')]]//mat-select`, element => element.click());
            await page.waitForSelector('mat-option');
            await page.$eval(`xpath=//mat-option[contains(., 'Sport')]`, element => element.click());
            console.log("Selected 'Sport' type")

            await page.click('mat-select[name="periodo"]');
            await page.waitForSelector('mat-option');
            await page.$eval(`xpath=//mat-option[contains(., '7 giorni')]`, element => element.click());
            await page.$eval(`xpath=//button[contains(., 'Cerca')]`, element => element.click());
            console.log("Selected '7 days' period and clicked 'Search'");

            await delay(1500, 2000);
        },
        getBetElements: async (page) => {
            return page.$$('tbody[role="rowgroup"] > tr');
        },
        extractBetDetails: async (page, betElement) => {
            const date = await betElement.$eval('td:first-child .lh-2', el => el.textContent.trim());

            await betElement.click();
            await page.waitForSelector('.dialog-content', {visible: true, timeout: 5000});

            const importoGiocato = await page.$eval('.top-row-info.light-bg span:last-child', el => el.textContent.trim() || '');
            const esitoTotale = await page.$eval('.top-row-info.short span:last-child', el => el.textContent.trim() || '');
            const quotaTotale = await page.$eval('.quotation span:last-child', el => el.textContent.trim() || '');
            const vincitaPotenziale = await page.$eval('.potential-win span:last-child', el => el.textContent.trim() || '');

            const eventElements = await page.$$('.dialog-content tbody[role="rowgroup"] > tr');
            const events = [];

            for (const eventRow of eventElements) {
                const dateString = await eventRow.$eval('.container-date-fixed .date', el => el?.textContent?.trim() || '');
                const [datePart, timePart] = dateString.split(' ');
                const [day, month, year] = datePart.split('/');
                const date = new Date(`${year}-${month}-${day}T${timePart}`);

                const dotElement = await eventRow.$('.dot');
                let status = '';
                if (dotElement) {
                    const classes = await dotElement.evaluate(el => Array.from(el.classList));
                    if (classes.includes('yellow')) status = 'In corso';
                    else if (classes.includes('green')) status = 'Vinto';
                    else if (classes.includes('red')) status = 'Perso';
                }

                const competition = await eventRow.$eval('.sport', el => el?.textContent?.trim() || '');
                const name = await eventRow.$eval('.game', el => el?.textContent?.trim() || '');
                const marketType = await eventRow.$eval('td.mat-column-Scommessa .lh-2', el => el?.textContent?.trim() || '');
                const selection = await eventRow.$eval('.d-inline-block:nth-child(2) .lh-2', el => el?.textContent?.trim() || '');
                const odds = await eventRow.$eval('td.mat-column-Quota .lh-2', el => el?.textContent?.trim() || '');

                events.push({
                    date: date.getTime(),
                    competition,
                    name,
                    marketType,
                    selection,
                    odds,
                    status,
                    matchResult: "N/A"
                });
            }

            const latestEventDate = new Date(Math.max(...events.map(e => e.date)));
            const betId = date.replace(/[/:\s]/g, '') + quotaTotale.replace('.', '');

            return {
                site: "Goldbet",
                date: date,
                betId: betId,
                importoGiocato: importoGiocato,
                esitoTotale: esitoTotale,
                quotaTotale: quotaTotale,
                vincitaPotenziale: vincitaPotenziale,
                events: events,
                latestEventDate: latestEventDate
            };
        },
        closeBetDetails: async (page) => {
            await page.click('mat-icon.close-icon');
        }
    });
}

module.exports = { getGoldBetterActiveBets };
