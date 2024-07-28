const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const config = require('../../config/config');
const { saveCookies, loadCookies } = require('../utils/cookies');
const { saveSessionData, loadSessionData } = require('../utils/session');

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// Funzione di attesa personalizzata
function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

async function isUserLoggedIn(page) {
  try {
    // Verifica la presenza del pulsante di login
    const loginButtonSelector = 'button.header__login--desktop.generic-button.generic-button--dark.generic-button--md';
    await page.waitForSelector(loginButtonSelector, { visible: true, timeout: 5000 });

    // Evidenzia il pulsante "Accedi" cambiando il colore di sfondo
    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.backgroundColor = 'yellow';
        setTimeout(() => {
          element.style.backgroundColor = '';
        }, 2000); // Ripristina il colore originale dopo 2 secondi
      }
    }, loginButtonSelector);

    console.log('Pulsante "Accedi" trovato.');
    return false;
  } catch (error) {
    console.log('Utente già loggato o errore durante la verifica del pulsante "Accedi".');
    return true;
  }
}

async function getEurobetBalance() {
  console.log('Inizio del processo di recupero del saldo da Eurobet');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ]
  });
  const page = await browser.newPage();

  // Imposta un User-Agent che simuli un browser reale
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  console.log('Navigazione verso https://www.eurobet.it/');
  await page.goto('https://www.eurobet.it/', { waitUntil: 'networkidle2' });

  try {
    await loadCookies(page, 'eurobet_cookies.json');
    await loadSessionData(page, 'eurobet_session.json');
    await page.reload();

    const loggedIn = await isUserLoggedIn(page);

    if (!loggedIn) {
      console.log('Attesa del pulsante "Accedi"');
      await page.waitForSelector('button.header__login--desktop.generic-button.generic-button--dark.generic-button--md', { visible: true });

      console.log('Clic sul pulsante "Accedi"');
      await page.click('button.header__login--desktop.generic-button.generic-button--dark.generic-button--md');

      console.log('Attesa del campo username');
      await page.waitForSelector('input[name="username"]', { visible: true });

      console.log('Inserimento username');
      await page.type('input[name="username"]', config.eurobet.username);

      console.log('Inserimento password');
      await page.type('input[name="password"]', config.eurobet.password);

      console.log('Attesa del pulsante di accesso');
      const submitButtonSelector = 'button.modals__submit-button.generic-button.generic-button--md.generic-button--primary[name="submit"]';
      await page.waitForSelector(submitButtonSelector, { visible: true });

      console.log('Scorrimento fino al pulsante di accesso');
      await page.evaluate((selector) => {
        document.querySelector(selector).scrollIntoView();
      }, submitButtonSelector);

      console.log('Aggiunta di un ritardo per assicurarsi che tutto sia caricato');
      await delay(1000);  // Aggiungi un ritardo di 1 secondo

      console.log('Clic sul pulsante di accesso');
      await page.click(submitButtonSelector);

      await delay (5000);

      // Attesa dell'elemento del saldo
      console.log('Attesa dell\'elemento del saldo');
      await page.waitForSelector('div.header__balance', { visible: true });

      // Recupero del saldo
      console.log('Recupero del saldo');
      const saldo = await page.$eval('div.header__balance', el => el.textContent.trim());

      console.log('Il tuo saldo è:', saldo);

      await saveCookies(page, 'eurobet_cookies.json');
      await saveSessionData(page, 'eurobet_session.json');

      await browser.close();
      return saldo;
    } else {
      console.log('Utente già loggato, procedo con il rilevamento del saldo.');

      // Attesa dell'elemento del saldo
      console.log('Attesa dell\'elemento del saldo');
      await page.waitForSelector('div.header__balance', { visible: true });

      // Recupero del saldo
      console.log('Recupero del saldo');
      const saldo = await page.$eval('div.header__balance', el => el.textContent.trim());

      console.log('Il tuo saldo è:', saldo);

      await saveCookies(page);
      await saveSessionData(page);

      await browser.close();
      return saldo;
    }
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getEurobetBalance };
