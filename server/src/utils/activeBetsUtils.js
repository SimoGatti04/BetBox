const { delay, setupBrowser } = require('../utils/botUtils');
const fs = require('fs').promises;
const path = require('path');

async function getActiveBets(site, {
    siteLogin,
    acceptCookies,
    navigateToActiveBets,
    selectTimePeriod,
    getBetElements,
    extractBetDetails,
    closeBetDetails
}) {
    console.log(`Starting active bets retrieval process for ${site}`);

    const { browser, context, page } = await setupBrowser(site);

    let betsData = [];

    try {
        await siteLogin(page, site);
        await acceptCookies(page);

        await navigateToActiveBets(page);
        await selectTimePeriod(page);


        if (site.toLowerCase() === 'snai'){
            const { firstSectionBets, firstButtonCoordinates, closedSectionBets, secondButtonCoordinates } = await getBetElements(page);
            console.log('Found bets: ', firstSectionBets.length + closedSectionBets.length);
            await extractAndSaveSnai(firstSectionBets, firstButtonCoordinates, extractBetDetails, site, page, betsData, closeBetDetails);
            await page.$eval(`xpath=//a[contains(., 'Chiuse')]`, element => element.click());
            try{
                await page.waitForSelector('.MieScommesseTableRow_container__ATvwj');
                await extractAndSaveSnai(closedSectionBets, secondButtonCoordinates, extractBetDetails, site, page, betsData, closeBetDetails);
            } catch (error) {
                console.log ("No closed bets found");
            }
        } else {
            const betElements = await getBetElements(page);
            console.log(`Found bets: ${betElements.length}`);
            await extractAndSave(betElements, extractBetDetails, site, page, betsData, closeBetDetails);
        }

    } catch (error) {
        console.error(`Error retrieving active bets for ${site}: `, error);
    } finally {
        await browser.close();
    }

    return JSON.stringify(betsData, null, 2);
}

async function saveBet(bet, site) {
    const fileName = `${bet.betId}.json`;
    const betPath = path.join(__dirname, '..', '..', 'activeBets', site.toLowerCase(), fileName);
    await fs.mkdir(path.dirname(betPath), { recursive: true });
    await fs.writeFile(betPath, JSON.stringify(bet, null, 2));
}

async function checkIfAndSave(site, page, betDetails, betsData, closeBetDetails){
    const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            if (betDetails.latestEventDate > oneDayAgo) {
                const bet = {
                    ...betDetails
                };
                await saveBet(bet, site);
                betsData.push(bet);
            }

            await closeBetDetails(page);

}

async function extractAndSave(betElements, extractBetDetails, site, page, betsData, closeBetDetails) {
    for (const betElement of betElements) {
        const betDetails = await extractBetDetails(page, betElement);
        await checkIfAndSave(site, page, betDetails, betsData, closeBetDetails);
    }
    console.log(`Active bets data saved individually`);
}

async function extractAndSaveSnai(betElements, buttonCoordinates, extractBetDetails, site, page, betsData, closeBetDetails) {
    for (let i = 0; i < betElements.length; i++) {
        const betElement = betElements[i];
        const buttonCoordinate = buttonCoordinates[i];
        const betDetails = await extractBetDetails(page, betElement, buttonCoordinate);

        await checkIfAndSave(site, page, betDetails, betsData, closeBetDetails);
    }
    console.log(`Active bets data saved individually`);
}

module.exports = { getActiveBets };
