const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile } = require('../../utils/botUtils');
const { setupGoldBetterBrowser, goldBetterLogin, acceptGoldBetterCookies } = require('../../utils/goldBetterUtils');
const fs = require('fs').promises;
const path = require('path');

async function getGoldBetterActiveBets(site) {
    console.log(`Inizio del processo di recupero scommesse attive su ${site}`);

    const {browser, context, page} = await setupBrowser(site.toLowerCase());
    await setupGoldBetterBrowser(page, site);

    let betsData = [];

    try {
        await goldBetterLogin(page, site);
        await acceptGoldBetterCookies(page);

        await page.click('div.conto a span.material-icons');
        console.log("Cliccato pulsante conto")
        await page.click('span.fa-stack i.material-icons-outlined');
        console.log("Cliccato pulsante giocate")
        await page.waitForSelector('table tbody tr', { timeout: 10000 });

        // Select period from dropdown
        await page.click('mat-select[name="periodo"]');
        await page.waitForSelector('mat-option');
        await page.click('mat-option:has-text("7 giorni")');
        await page.click('button:has-text("Cerca")');
        console.log("Selezionato periodo '7 giorni' e cliccato 'Cerca'");

        await delay(1500, 2000);
        const betElements = await page.$$('tbody[role="rowgroup"] > tr');
        console.log("Trovate giocate:", betElements.length);

        for (const betElement of betElements) {
            const betId = await betElement.$eval('td:first-child .lh-2', el => el.textContent.trim());

            await betElement.click();
            await page.waitForSelector('.dialog-content', { visible: true, timeout: 5000 });

            const betDetails = await page.evaluate(() => {
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
                        result: result
                    };
                });

                const latestEventDate = new Date(Math.max(...events.map(e => e.date)));

                return { importoGiocato, esitoTotale, quotaTotale, vincitaPotenziale, events, latestEventDate };
            });

            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            if (betDetails.latestEventDate > oneDayAgo) {
                betsData.push({ betId, ...betDetails });
            }

            await page.click('mat-icon.close-icon');
        }

        const jsonData = JSON.stringify(betsData, null, 2);
        const filePath = path.join(__dirname, '..', '..', '..', 'activeBets', `${site.toLowerCase()}ActiveBets.json`);
        await fs.writeFile(filePath, jsonData);

        console.log(`Active bets data saved to ${filePath}`);

    } catch (error) {
        console.error(`Errore durante il recupero delle scommesse attive su ${site}: `, error);
    } finally {
        await browser.close();
    }

    return JSON.stringify(betsData, null, 2);
}

module.exports = { getGoldBetterActiveBets };
