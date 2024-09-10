const { getActiveBets } = require('../../utils/activeBetsUtils');
const { snaiLogin, acceptSnaiCookies } = require('../../utils/snaiUtils');
const { delay } = require("../../utils/botUtils");

async function getSnaiActiveBets() {
    return getActiveBets('Snai', {
        siteLogin: snaiLogin,
        acceptCookies: acceptSnaiCookies,
        navigateToActiveBets: async (page) => {
            await page.click('div.UserNavigation_btnLinkContainer__Lc20b > button.UserNavigation_btnLink__vk3Hf');
            await page.waitForSelector('div.PersonalAreaMobileMenu_item__9qOUI > a[href="/dashboard/le-mie-scommesse"]');
            await page.click('div.PersonalAreaMobileMenu_item__9qOUI > a[href="/dashboard/le-mie-scommesse"]');
            await page.waitForNavigation();
        },
        selectTimePeriod: async (page) => {
            // Implement if there's a time period selection for Snai
        },
        getBetElements: async (page) => {
            const highlightElements = async (elements) => {
                await page.evaluate((els) => {
                    els.forEach(el => {
                        el.style.border = '3px solid red';
                        el.style.backgroundColor = 'yellow';
                    });
                }, elements);
            };

            // Get bets from the first section
            await page.waitForSelector('.MieScommesseTableRow_container__ATvwj');
            const firstSectionBets = await page.$$('.MieScommesseTableRow_container__ATvwj');
            await highlightElements(firstSectionBets);
            const firstButtonCoordinates = await getButtonCoordinates(page);

            // Click on the "Chiuse" tab
            await page.click('li.InternalMenu_item__6gG2H a.InternalMenu_link__a8VCz:has-text("Chiuse")');
            await page.waitForSelector('.MieScommesseTableRow_container__ATvwj');

            // Get bets from the "Chiuse" section
            const closedSectionBets = await page.$$('.MieScommesseTableRow_container__ATvwj');
            await highlightElements(closedSectionBets);
            const secondButtonCoordinates = await getButtonCoordinates(page);

            await page.click('li.InternalMenu_item__6gG2H a.InternalMenu_link__a8VCz:has-text("Aperte")');
            await page.waitForSelector('.MieScommesseTableRow_container__ATvwj');

            return { firstSectionBets, firstButtonCoordinates, closedSectionBets, secondButtonCoordinates };
        },
        extractBetDetails: async (page, betElement, buttonCoordinate) => {
            await page.evaluate((el) => {
                el.style.border = '3px solid red';
                el.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
            }, betElement);

            if (buttonCoordinate) {
                await page.mouse.click(buttonCoordinate.x + buttonCoordinate.width / 2, buttonCoordinate.y + buttonCoordinate.height / 2);
                console.log(`Clicked button at coordinates (${buttonCoordinate.x}, ${buttonCoordinate.y})`);
                await delay (2000, 3000);
            } else {
                console.log(`Button coordinates not found for this bet element`);
            }

            await page.waitForSelector('.DetailedBet_container__TVFF8');

            const betDetails = await page.evaluate(() => {
                const getFieldValue = (label) => {
                    const fields = Array.from(document.querySelectorAll('.TableField_fieldContainer__TvNV8'));
                    const field = fields.find(f => f.textContent.includes(label));
                    return field ? field.querySelector('.TableField_betData__IZ1_N').textContent.trim() : '';
                };
                    const importoGiocato = getFieldValue('Importo giocato');
                    const vincitaPotenziale = getFieldValue('Possibile vincita');
                    const stateField = Array.from(document.querySelectorAll('.StateField_fieldContainer__crfK6')).find(el => el.textContent.includes('Stato'));
                    const esitoTotale = stateField ? stateField.querySelector('.StateField_betData__SBG_g').textContent.trim() : 'N/A';
                    const dateTime = getFieldValue('Emesso');
                    const quotaTotale = getFieldValue('Quota totale');
                    const betId = dateTime.replace(/[/:\s]/g, '') + quotaTotale.replace('.', '');

                const events = Array.from(document.querySelectorAll('.BetEventTableRow_container__paVmw')).map(event => ({
                    date: event.querySelector('.BetEventTableRow_match__T20aH p').textContent.trim(),
                    competition: event.querySelector('.BetEventTableRow_details__U_lmE').textContent.trim(),
                    name: event.querySelector('.BetEventTableRow_team__ATJs7').textContent.trim(),
                    marketType: event.querySelector('.BetEventTableRow_resultLabel__ZU5Zm').textContent.split(':')[0].trim(),
                    selection: event.querySelector('.BetEventTableRow_resultLabelBold__wd8FY').textContent.trim(),
                    odds: event.querySelector('.BetEventTableRow_match__T20aH:nth-child(3) p').textContent.trim(),
                    result: event.querySelector('.BetEventTableRow_statusText__UetJ_').textContent.trim(),
                    matchResult: "N/A"
                }));
                const lastDate = new Date();

                return {
                    site: "Snai",
                    date: dateTime,
                    betId: betId,
                    importoGiocato: importoGiocato,
                    esitoTotale: esitoTotale === 'Aperta' ? 'In corso' : (esitoTotale === 'Vincente' ? 'Vincente' : 'Perdente'),
                    quotaTotale: quotaTotale,
                    vincitaPotenziale: vincitaPotenziale,
                    events: events.map(event => ({
                        ...event,
                        result: event.result === 'Aperta' ? 'In corso' :
                                (event.result === 'Vincente' ? 'Vincente' : 'Perdente')
                    })),
                    latestEventDate: new Date(Math.max(...events.map(e => e.date))),
                };
            });

            return betDetails;
        },
        closeBetDetails: async (page) => {
            await page.click('button.ActionButton_buttonText__E5G8G:has-text("indietro")');
        }
    });
}

async function getButtonCoordinates(page) {
    return await page.evaluate(() => {
        const buttons = document.querySelectorAll('button.Button_buttonContainer__X4FDJ.Button_large__1ioa8.MieScommesseTableRow_iconContainer__r6d_e');
        return Array.from(buttons).map(button => {
            const rect = button.getBoundingClientRect();
            return {
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height
            };
        });
    });
}



module.exports = { getSnaiActiveBets };
