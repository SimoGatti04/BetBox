const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const config = require('../../config/config');
const { saveCookies, loadCookies } = require('../utils/cookies');
const { saveSessionData, loadSessionData } = require('../utils/session');

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function acceptCookies(page) {
  try {
    await page.waitForSelector('button.iubenda-cs-accept-btn.iubenda-cs-btn-primary', { visible: true, timeout: 5000 });
    await page.click('button.iubenda-cs-accept-btn.iubenda-cs-btn-primary');
    console.log('Cookie accettati');
  } catch (error) {
    console.log('Nessun banner cookie trovato o già accettato');
  }
}

async function login(page) {
  try{
    await page.waitForSelector('button.buttons.button--primary.button--medium.ng-star-inserted');
    await page.click('button.buttons.button--primary.button--medium.ng-star-inserted');

    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', config.cplay.username);
    await page.type('input[name="password"]', config.cplay.password);

    await page.click('button.buttons.button--primary.button--large.ng-star-inserted');
    await delay(5000);
  } catch (error) {
      console.log('Login già eseguito o errore durante il login', error);
  }
}

async function handleDeviceVerification(page) {
  try {
    await page.waitForSelector('span.messagebox__item__title__text', { timeout: 5000 });
    const verificationText = await page.$eval('span.messagebox__item__title__text', el => el.textContent);

    if (verificationText.includes('Autorizza il dispositivo')) {
      console.log('Verifica del dispositivo richiesta');
      await new Promise(resolve => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        readline.question('Approva l\'accesso via email e premi Invio...', () => {
          readline.close();
          resolve();
        });
      });

      console.log('Attendo la comparsa del pulsante "Ricevuta!"');
      await page.waitForSelector('button.buttons.button--primary.button--medium.ng-star-inserted', { visible: true, timeout: 30000 });
      await page.click('button.buttons.button--primary.button--medium.ng-star-inserted');
      console.log('Pulsante "Ricevuta!" cliccato');

      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
      console.log('Navigazione completata dopo la verifica del dispositivo');
    }
  } catch (error) {
    console.log('Errore durante la verifica del dispositivo:', error);
  }
}


async function getBalance(page) {
  await page.waitForSelector('div.topbar-main__account-user-logged__balance strong');
  const balance = await page.$eval('div.topbar-main__account-user-logged__balance strong', el => el.textContent);
  return balance.trim();
}

async function getCplayBalance() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.cplay.it/');

    await loadCookies(page, 'cplay_cookies.json');
    await loadSessionData(page, 'cplay_session.json');
    await page.reload(); // Ricarica la pagina per applicare i cookies e i dati di sessione
    await delay (4000);
    await acceptCookies(page);


    await login(page);

    await handleDeviceVerification(page);

    await saveCookies(page, 'cplay_cookies.json');
    await saveSessionData(page, 'cplay_session.json');

    const balance = await getBalance(page);
    console.log('Saldo Cplay:', balance);


    await browser.close();
    return balance;
  } catch (error) {
    console.error('Errore durante il recupero del saldo Cplay:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getCplayBalance };
