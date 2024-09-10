const { getActiveBets } = require('../../utils/activeBetsUtils');
const { sisalLogin, setupSisalBrowser, acceptSisalCookies } = require('../balances/sisalBot');
const {delay} = require("../../utils/botUtils");

async function getSisalActiveBets() {
    return getActiveBets('Sisal', {
        setupSiteBrowser: async (page, site) => {
            await setupSisalBrowser()
        },
        siteLogin: sisalLogin,
        acceptCookies: async (page) => {
           await acceptSisalCookies(page)
        },
        navigateToActiveBets: async (page) => {
            await page.click('a.utils-user.js-private-area.js-jwt-link');
            await page.waitForNavigation();
            await page.click('#SidebarNav_Movimenti_conto a');
            await delay(1000,2000);
            await page.click('#ID_UltimiMovimenti_Vedi_tutti');
            await delay(1000,2000);
            await page.click('div[role="tab"] span:has-text("Scommesse")');
            await page.waitForSelector('div[role="table"]');
        },
        selectTimePeriod: async (page) => {
            // Sisal doesn't seem to have a separate time period selection
        },
        getBetElements: async (page) => {
            await delay (2000,3000);
            return page.$$('div[role="tablerow"]');
        },
        extractBetDetails: async (page, betElement) => {
            const betData = await betElement.evaluate(row => {
                const statusElement = row.querySelector('.Tablestyle__CirclesStatus-sc-c9tl2m-1');
                let esitoTotale = 'In corso';
                if (statusElement) {
                    const background = window.getComputedStyle(statusElement).getPropertyValue('background');
                    if (background.includes('234, 43, 31')) esitoTotale = 'Perdente';
                    else if (background.includes('191, 215, 47')) esitoTotale = 'Vincente';
                }

                const dateTimeElement = row.querySelector('div[data-date-time="true"]');
                const date = dateTimeElement.querySelector('span:first-of-type').textContent;
                const time = dateTimeElement.querySelector('span:last-of-type').textContent;
                const dateTime = `${date} ${time}`;

                const importoGiocato = row.querySelector('div[role="columnbody"] .sc-imwsjW .sc-epALIP span').textContent.trim();

                return { esitoTotale, dateTime, importoGiocato };
            });

            await betElement.$eval('button:has-text("Ricevuta")', button => button.click());
            await page.waitForSelector('.main.betslip-container', { state: 'visible', timeout: 10000 });
            await delay(1000,1500)

            const betDetails = await page.evaluate(() => {
                let quotaTotale, vincitaPotenziale;
                try {
                    quotaTotale = document.querySelector('p.tw-fr-m-0.tw-fr-font-roboto-medium.tw-fr-font-medium.tw-fr-text-paragraph-s.tw-fr-uppercase.tw-fr-text-tdt-blue-dark').textContent.trim();
                    console.log("ok quota");
                    vincitaPotenziale = document.querySelectorAll('p.tw-fr-m-0.tw-fr-font-roboto-medium.tw-fr-font-medium.tw-fr-text-paragraph-s.tw-fr-uppercase.tw-fr-text-tdt-blue-dark')[1].textContent.trim();
                    console.log("ok vincita");
                } catch (error) {
                    console.error('Errore durante l\'estrazione dei dettagli della scommessa:', error);
                    quotaTotale = 'N/A';
                    vincitaPotenziale = 'N/A';
                }
                const events = Array.from(document.querySelectorAll('.events-list-container > div')).map(event => {
                    let date;
                    try{
                        const dateElement = event.querySelector('.tw-fr-w-\\[46px\\].tw-fr-h-\\[46px\\].tw-fr-pt-\\[11px\\].tw-fr-text-paragraph-xs');
                        if (dateElement) {
                            const dateText = dateElement.textContent.trim();
                            const [dayMonth, time] = dateText.split(' ');
                            const [day, month] = dayMonth.split('/');
                            const year = new Date().getFullYear(); // Assuming the event is in the current year
                            date = new Date(`${year}-${month}-${day}T${time}`).getTime();
                        } else {
                            date = Date.now(); // Fallback to current date if not found
                        }
                    } catch (error) {
                        console.error('Errore durante l\'estrazione dei dettagli dell\'evento:', error);
                        date = Date.now(); // Fallback to current date if not found
                    }
                    const competition = event.querySelector('p.tw-fr-text-paragraph-xs').textContent.trim();
                    console.log("ok competition")
                    const name = event.querySelector('ul.tw-fr-flex.tw-fr-flex-col').textContent.replace(/\n/g, ' - ').trim();
                    console.log("ok name")
                    const marketType = event.querySelector('div.tw-fr-text-\\[12px\\]').textContent.trim();
                    console.log("ok marketType")
                    const selectionAndOdds = event.querySelector('p.tw-fr-text-paragraph-s').textContent.trim();
                    console.log("ok selectionAndOdds")
                    const [selection, odds] = selectionAndOdds.split('(');
                    console.log("ok selectionAndOdds")

                    let result = 'In corso';
                    if (event.querySelector('i.icon-Status-Lose')) result = 'Perso';
                    else if (event.querySelector('i.icon-Status-Won')) result = 'Vinto';

                    return {
                        date,
                        competition,
                        name,
                        marketType,
                        selection: selection.trim(),
                        odds: odds ? odds.replace(')', '') : '',
                        result,
                        matchResult: null
                    };
                });
                const latestEventDate = new Date(Math.max(...events.map(e => e.date)));
                return { quotaTotale, vincitaPotenziale, events, latestEventDate };
            });

            const betId = betData.dateTime.replace(/[/:\s]/g, '') + betDetails.quotaTotale.replace('.', '');

            return {
                site: 'Sisal',
                date: betData.dateTime,
                betId: betId,
                importoGiocato: betData.importoGiocato,
                esitoTotale: betData.esitoTotale,
                quotaTotale: betDetails.quotaTotale,
                vincitaPotenziale: betDetails.vincitaPotenziale,
                events: betDetails.events,
                latestEventDate: betDetails.latestEventDate
            };
        },
        closeBetDetails: async (page) => {
            await page.click('div.text-center.closeItem.extended-touch');
            await page.waitForSelector('.main.betslip-container', { state: 'hidden' });
        }
    });
}

module.exports = { getSisalActiveBets };
