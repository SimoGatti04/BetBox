const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping,
    etupBrowser, getSessionFile, saveSession} = require('../../../utils/puppeteer/botUtils');
const config = require('../../../../config/config');
const fs = require("fs");

async function acceptSisalCookies(page) {
  try {
    await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
    await page.click('#onetrust-accept-btn-handler');
    console.log('Cookies accepted successfully');
  } catch (error) {
    console.log('Cookie acceptance button not found or already accepted');
  }
}


async function sisalLogin(page) {
  let isUserLoggedIn = false;
  console.log('Navigazione verso https://www.sisal.it/');
  await page.goto('https://www.sisal.it/', {waitUntil: 'networkidle0'});

  try {
    console.log('Attesa del pulsante "Accedi"');
    await page.waitForSelector('a.utils-user-logger.btn.btn-outline-primary.btn-sm.js-login.analytics-element', {state: 'visible'});
  } catch (error) {
    isUserLoggedIn = true;
  }
    if (!isUserLoggedIn) {
    try {
        console.log('Clic sul pulsante "Accedi"');
        await page.click('a.utils-user-logger.btn.btn-outline-primary.btn-sm.js-login.analytics-element');

        console.log('Attesa del campo username');
        const usernameInput = await page.waitForSelector(`xpath=//form//div//div[.//label[contains(text(), "Email / Username")]]//input`);
        await usernameInput.click();

        const inputValue = await page.$eval('input[name="usernameEtc"]', el => el.value);
          if (!inputValue || inputValue!==config.sisal.username){
            console.log('Inserimento username');
            await simulateTyping(page, 'input[name="usernameEtc"]', config.sisal.username);
          }

        console.log('Inserimento password');
        await page.click('input[name="password"]');
        await page.keyboard.type(config.sisal.password);
        await delay(1000, 2000);

        console.log('Attesa del pulsante di invio accesso');
        const accediButton = await page.waitForSelector(`xpath=//form//button[contains(text(), "Accedi") and not(@disabled)]`);

        console.log('Clic sul pulsante di invio accesso');
        await accediButton.click();

        await delay(7500, 10000);

        let currentUrl = await page.url();
        if (currentUrl.startsWith('https://areaprivata.sisal.it/')) {
          console.log('Login non riuscito. Ricarico la pagina e riprovo.');
          await page.reload({waitUntil: 'networkidle0'});

          const inputValue = await page.$eval('input[name="usernameEtc"]', el => el.value);
          if (!inputValue || inputValue!==config.sisal.username){
              console.log('Reinserimento username');
              await simulateTyping(page, 'input[name="usernameEtc"]', config.sisal.username);
          }

          console.log('Reinserimento password');
          await simulateTyping(page, 'input[name="password"]', config.sisal.password);

          console.log('Clic sul pulsante di invio accesso (secondo tentativo)');
          await page.waitForSelector(accediButton);
          await page.click(accediButton);

          await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 60000});
        }
      } catch (error) {
        console.log('Nessun pulsante di accesso trovato o errore durante il clic:', error);
      }
    }
}

async function getSisalBalance() {
  console.log('Inizio del processo di recupero del saldo da Sisal');
  const { browser, context, page } = await setupBrowser('sisal');

  try {
    await sisalLogin(page);

    console.log('Attesa dell\'elemento del saldo');
    await page.waitForSelector('div.js-balance');

    console.log('Recupero del saldo');
    const saldo = await page.$eval('div.js-balance', el => el.textContent.trim());

    console.log('Il tuo saldo è:', saldo);

    await saveSession(page, 'sisal');

    return saldo;
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = { getSisalBalance, sisalLogin , acceptSisalCookies};

