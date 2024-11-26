const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile, saveSession} = require('../../utils/botUtils');
const config = require('../../../config/config');
const fs = require("fs");

async function isUserLoggedIn(page) {
  try {
    const loginButtonSelector = 'button.header__login--desktop.generic-button.generic-button--dark.generic-button--md';
    await page.waitForSelector(loginButtonSelector, { timeout: 5000 });
    console.log('Pulsante "Accedi" trovato.');
    return true;
  } catch (error) {
    console.log('Utente già loggato o Pagina Errata');
    return false;
  }
}

async function getEurobetBalance() {
  console.log('Inizio del processo di recupero del saldo da Eurobet');

  const {browser, page} = await setupBrowser('eurobet');
  let saldo;

  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'it-IT,it;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.google.it/',
      'DNT': '1'
    });

    console.log('Navigazione verso https://www.eurobet.it/');

    await page.goto('https://www.eurobet.it/');
    await delay(6000, 7000);
    const loggedIn = await isUserLoggedIn(page);

    if (!loggedIn) {
      try {
        saldo = await estraiPrincipale(page, browser);
      } catch (error) {
        console.log("Errore nell'estrazione del saldo principale: ", error);
      }
      try {
        saldo = await processoSecondario(page, browser);
      } catch (error) {
        console.log("Errore nell'accesso secondario: ", error)
        saldo = await estraiSecondario(page, browser);
      }
    } else {
      try {
        saldo = await processoPrincipale(page, browser);
      } catch (error) {
        console.log("Errore nell'accesso primario: ", error)
      }
    }
  } catch (error) {
    console.log("Errore negli accessi o nell'estrazione: ",error)
  }

  await saveSession(page, 'eurobet');
  await browser.close();

  return `${saldo} €`;
}


async function processoPrincipale(page, browser){
  try {
      console.log('Attesa del pulsante "Accedi"');
      await page.waitForSelector('button.header__login--desktop.generic-button.generic-button--dark.generic-button--md');

      console.log('Clic sul pulsante "Accedi"');
      await page.click('button.header__login--desktop.generic-button.generic-button--dark.generic-button--md');
    } catch (error){
      console.log('Errore durante la verifica del pulsante "Accedi".');
    }

    await delay(1000, 2000);

    console.log('Attesa del campo username');
    await page.waitForSelector('input[name="username"]');

    console.log('Inserimento username');
    await simulateTyping(page, 'input[name="username"]', config.eurobet.username);

    console.log('Inserimento password');
    await simulateTyping(page, 'input[name="password"]', config.eurobet.password);

    console.log('Attesa del pulsante di accesso');
    const submitButtonSelector = 'button.modals__submit-button.generic-button.generic-button--md.generic-button--primary[name="submit"]';
    await page.waitForSelector(submitButtonSelector);

    console.log('Scorrimento fino al pulsante di accesso');
    await page.evaluate((selector) => {
      document.querySelector(selector).scrollIntoView();
    }, submitButtonSelector);

    await delay(1000, 2000);

    console.log('Clic sul pulsante di accesso');
    await page.click(submitButtonSelector);

    await delay(5000, 6000);

    return estraiPrincipale(page, browser);
}

async function processoSecondario(page, browser){
  console.log("Inserisco username")
  page.waitForSelector('input[name="username"]');
  page.click('input[name="username"]')
  await delay (1000,2000)
  page.keyboard.type(config.eurobet.username)
  await delay (1000,2000)

  console.log("Inserisco password")
  page.waitForSelector('input[name="password"]');
  page.click('input[name="password"]')
  await delay (1000,2000)
  page.keyboard.type(config.eurobet.password)

  console.log("Accedo")
  await page.waitForSelector(`xpath=//button[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "accedi")]`);
  await page.click(`xpath=//button[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "accedi")]`);

  return estraiSecondario(page, browser);
}

async function estraiPrincipale(page, browser){
  console.log('Attesa dell\'elemento del saldo');
  await page.waitForSelector('div.header__balance');

  console.log('Recupero del saldo');
  const saldoText = await page.evaluate(() =>
    document.querySelector('div.header__balance').textContent.trim()
  );
  const saldo = saldoText.replace('Saldo ', '');

  console.log('Il tuo saldo è:', saldo);

  return saldo;
}

async function estraiSecondario(page, browser){
  await delay (4000,5000)
  console.log("Recupero saldo")
  const saldo = await page.evaluate(() => {
      const integerPart = document.querySelector('.odometer-value').textContent;
      const decimalPart = document.querySelectorAll('.cent .odometer-value');
      const decimal = Array.from(decimalPart).map(el => el.textContent).join('').slice(0, 2);
      return `${integerPart},${decimal}`;
  });

  console.log('Saldo:', saldo + ' €');

  return saldo;
}



module.exports = { getEurobetBalance };
