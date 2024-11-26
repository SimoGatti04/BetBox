const { delay, setupBrowser, smoothMouseMoveToElement } = require('../../utils/botUtils');
const config = require('../../../config/config');
const { updateSpinHistory} = require("../../utils/dailySpinUtils");

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
];

const screenResolutions = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 }
];

const languages = [
  'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
  'it-IT,it;q=0.9,en-GB;q=0.8,en;q=0.7',
  'it;q=0.9,en-US;q=0.8,en;q=0.7',
  'it-IT;q=0.9,it;q=0.8,en-US;q=0.7'
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function spinSnaiWheel() {
  console.log('Inizio del processo per il daily spin di Snai');

  const randomResolution = getRandomItem(screenResolutions);
  let { browser, context, page } = await setupBrowser('snai');
  let bonusInfo = null;

  try {
    await page.setUserAgent(getRandomItem(userAgents));

    await page.setViewport({
      width: randomResolution.width,
      height: randomResolution.height,
      deviceScaleFactor: 1,
    });

    await page.setExtraHTTPHeaders({
      'Accept-Language': getRandomItem(languages),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'DNT': Math.random() > 0.5 ? '1' : '0',
      'Upgrade-Insecure-Requests': '1'
    });

    console.log("Vado alla pagina dello spin di Snai")
    await page.goto("https://www.snai.it");

    console.log("Vado alla pagina delle promozioni")
    await page.waitForSelector(`svg#bonus`)
    await page.click(`svg#bonus`)

    await delay(2000, 3000);

    console.log("Vado alla pagina dello spin")
    const frameHandle = await page.waitForSelector('iframe.PageContent_frameContent__WtswF');
    const frame = await frameHandle.contentFrame();
    await frame.waitForSelector(`xpath=//app-card//mat-card[.//mat-card-header//div//mat-card-title//h1[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "gettone omaggio")]]`);
    await frame.click(`xpath=//app-card//mat-card[.//mat-card-header//div//mat-card-title//h1[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "gettone omaggio")]]`);

    await delay(2000,3000);
    await frame.waitForSelector(`xpath=//mat-card-content//div//p//a[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "qui")]`);

    const coordinates = await frame.evaluate(() => {
        const link = document.querySelector('a[href*="snaigiochi.it/casual/login"]');
        link.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = link.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    });

    const linkUrl = await frame.evaluate(() => {
        const link = document.querySelector('a[href*="snaigiochi.it/casual/login"]');
        return link.href;
    });

    await page.mouse.click(coordinates.x, coordinates.y, { button: 'right' });
    await delay(1000, 2000);

    const oldPage = page;
    const newPage = await browser.newPage();
    page = newPage;
    await newPage.goto(linkUrl);

    console.log("Cerco l'input per l'username");
    await page.waitForSelector('input[name="username"]')

    console.log("Inserisco l'username");
    await page.click('input[name="username"]')
    await page.keyboard.type(config.snai.username);

    console.log("Cerco l'input per la password");
    await page.waitForSelector('input[name="pass"]')

    console.log("Inserisco la password");
    await page.click('input[name="pass"]')
    await page.keyboard.type(config.snai.password);

    console.log("Cerco il pulsante di login");
    await page.waitForSelector('div#accedi_click_MONEY')

    console.log("Clicco sul pulsante di login");
    await page.click('div#accedi_click_MONEY');

    await delay(9000, 10000);

    console.log("Ricarico la pagina");
    await page.reload();

    await delay(9000, 10000);

    console.log("Controllo del risultato dello spin");
    const divs = await page.$$('div[id^="popup_estratto_"]');
    const backgroundImages = await Promise.all(divs.map(div => div.evaluate(el => getComputedStyle(el).backgroundImage)));

    const isWin = backgroundImages.every(img => img === backgroundImages[0]);

    if (isWin) {
      const isJackpot = backgroundImages[0] === 'url("assets/svg/icone/1.svg")';
      bonusInfo = {
        tipo: "Vinto",
        valore: isJackpot ? "0.50 €" : "altro"
      };
    } else {
      bonusInfo = { tipo: "Perso", valore: "0" };
    }

    console.log("Bonus Info: ", bonusInfo);
  } catch (error) {
    console.error('Errore durante l\'esecuzione del bot Snai:', error);
  } finally {
    await browser.close();
    updateSpinHistory('snai', bonusInfo);
  }

  return bonusInfo;
}

module.exports = { spinSnaiWheel };
