const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile } = require('../../utils/botUtils');
const config = require('../../../config/config');

async function isUserLoggedIn(page) {
  try {
    const loginButtonSelector = 'button.header__login--desktop.generic-button.generic-button--dark.generic-button--md';
    await page.waitForSelector(loginButtonSelector, { state: 'visible', timeout: 5000 });
    console.log('Pulsante "Accedi" trovato.');
    return false;
  } catch (error) {
    console.log('Utente già loggato o errore durante la verifica del pulsante "Accedi".');
    return true;
  }
}

async function getEurobetBalance() {
  console.log('Inizio del processo di recupero del saldo da Eurobet');

  const { browser, context, page } = await setupBrowser('eurobet');

  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'it-IT,it;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.google.it/',
      'DNT': '1'
    });

    console.log('Navigazione verso https://www.eurobet.it/');
    await page.goto('https://www.eurobet.it/', { waitUntil: 'networkidle' });

    const loggedIn = await isUserLoggedIn(page);

    if (!loggedIn) {
      try {
        console.log('Attesa del pulsante "Accedi"');
        await page.waitForSelector('button.header__login--desktop.generic-button.generic-button--dark.generic-button--md', {state: 'visible'});

        console.log('Clic sul pulsante "Accedi"');
        await page.click('button.header__login--desktop.generic-button.generic-button--dark.generic-button--md');
      } catch (error){
        console.log('Errore durante la verifica del pulsante "Accedi".');
      }
      console.log('Attesa del campo username');
      await page.waitForSelector('input[name="username"]', { state: 'visible' });

      console.log('Inserimento username');
      await simulateTyping(page, 'input[name="username"]', config.eurobet.username);

      console.log('Inserimento password');
      await simulateTyping(page, 'input[name="password"]', config.eurobet.password);

      console.log('Attesa del pulsante di accesso');
      const submitButtonSelector = 'button.modals__submit-button.generic-button.generic-button--md.generic-button--primary[name="submit"]';
      await page.waitForSelector(submitButtonSelector, { state: 'visible' });

      console.log('Scorrimento fino al pulsante di accesso');
      await page.evaluate((selector) => {
        document.querySelector(selector).scrollIntoView();
      }, submitButtonSelector);

      await delay(1000,2000);

      console.log('Clic sul pulsante di accesso');
      await page.click(submitButtonSelector);

      await delay(5000,6000);
    }

    console.log('Attesa dell\'elemento del saldo');
    await page.waitForSelector('div.header__balance', { state: 'visible' });

    console.log('Recupero del saldo');
    const saldoText = await page.$eval('div.header__balance', el => el.textContent.trim());
    const saldo = saldoText.replace('Saldo ', '');

    console.log('Il tuo saldo è:', saldo);

    await context.storageState({ path: getSessionFile('eurobet') });
    await browser.close();
    return saldo;
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getEurobetBalance };
