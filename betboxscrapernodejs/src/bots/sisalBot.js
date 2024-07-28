const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const config = require('../../config/config');
const { saveCookies, loadCookies } = require('../utils/cookies');
const { saveSessionData, loadSessionData } = require('../utils/session');

puppeteer.use(StealthPlugin());

// Funzione di attesa personalizzata
function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

async function getSisalBalance() {
  console.log('Inizio del processo di recupero del saldo da Sisal');

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

  console.log('Navigazione verso https://www.sisal.it/');
  await page.goto('https://www.sisal.it/', { waitUntil: 'networkidle2' });

  try {
    await loadCookies(page, 'sisal_cookies.json');
    await loadSessionData(page, 'sisal_session.json');
    await page.reload();

    try{

      console.log('Attesa del pulsante "Accedi"');
      await page.waitForSelector('a.utils-user-logger.btn.btn-outline-primary.btn-sm.js-login.analytics-element', { visible: true });

      console.log('Clic sul pulsante "Accedi"');
      await page.click('a.utils-user-logger.btn.btn-outline-primary.btn-sm.js-login.analytics-element');

      console.log('Attesa del campo username');
      await page.waitForSelector('input[name="usernameEtc"]', { visible: true });

      console.log('Inserimento username');
      await page.type('input[name="usernameEtc"]', config.sisal.username);

      console.log('Inserimento password');
      await page.type('input[name="password"]', config.sisal.password);

      console.log('Attesa del pulsante di invio accesso');
      await page.waitForSelector('button#buttonAuth', { visible: true });

      console.log('Clic sul pulsante di invio accesso');
      await page.click('button#buttonAuth');

      console.log('Attesa della navigazione dopo il login');
      await delay (7500);

      let currentUrl = await page.url();
      if (currentUrl.startsWith('https://areaprivata.sisal.it/')) {
        console.log('Login non riuscito. Ricarico la pagina e riprovo.');
        await page.reload({ waitUntil: 'networkidle0' });

        console.log('Reinserimento username');
        await page.type('input[name="usernameEtc"]', config.sisal.username);

        console.log('Reinserimento password');
        await page.type('input[name="password"]', config.sisal.password);

        console.log('Clic sul pulsante di invio accesso (secondo tentativo)');
        await page.click('button#buttonAuth');

        console.log('Attesa della navigazione dopo il secondo tentativo di login');
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
      }
    } catch (error) {
        console.log('Nessun pulsante di accesso trovato o errore durante il clic:', error);
    }

    console.log('Attesa dell\'elemento del saldo');
    await page.waitForSelector('div.js-balance', { visible: true });

    await saveCookies(page, 'sisal_cookies.json');
    await saveSessionData(page, 'sisal_session.json');

    console.log('Recupero del saldo');
    const saldo = await page.$eval('div.js-balance', el => el.textContent.trim());

    console.log('Il tuo saldo è:', saldo);

    await browser.close();
    return saldo;
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getSisalBalance };
