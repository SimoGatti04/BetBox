const { delay, setupBrowser } = require('../utils/botUtils');
const fs = require('fs').promises;
const path = require('path');

async function getActiveBets(site, {
    setupSiteBrowser,
    siteLogin,
    acceptCookies,
    navigateToActiveBets,
    selectTimePeriod,
    getBetElements,
    extractBetDetails,
    closeBetDetails
}) {
    console.log(`Starting active bets retrieval process for ${site}`);

    const {browser, context, page} = await setupBrowser(site.toLowerCase());

    let betsData = [];

    try {
        await siteLogin(page, site);
        await acceptCookies(page);

        await navigateToActiveBets(page);
        await selectTimePeriod(page);

        const betElements = await getBetElements(page);
        console.log(`Found bets: ${betElements.length}`);

        for (const betElement of betElements) {
            const betDetails = await extractBetDetails(page, betElement);

            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            if (betDetails.latestEventDate > oneDayAgo) {
                const bet = {
                    betId: `${betDetails.betId.replace(/[/:\s,€]/g, '')}${betDetails.quotaTotale.replace(/[.,€]/g, '')}`,
                    betDate: betDetails.betId,
                    ...betDetails
                };
                await saveBet(bet, site);
                betsData.push(bet);
            }

            await closeBetDetails(page);
        }

        console.log(`Active bets data saved individually`);

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

module.exports = { getActiveBets };
