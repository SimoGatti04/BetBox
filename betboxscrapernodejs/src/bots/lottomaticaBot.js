const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const config = require('../../config/config');
const { saveCookies, loadCookies } = require("../utils/cookies");
const { saveSessionData, loadSessionData } = require("../utils/session");

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

async function getLottomaticaBalance() {
  console.log('Inizio del processo di recupero del saldo da Lottomatica');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  console.log('Navigazione verso https://www.lottomatica.it/');
  await page.goto('https://www.lottomatica.it/', { waitUntil: 'networkidle2' });

  try {
    await loadCookies(page, 'lottomatica_cookies.json');
    await loadSessionData(page, 'lottomatica_session.json');
    await page.reload();


    console.log('Attesa del pulsante "Accedi"');
    await page.waitForSelector('button.anonymous--login--button', { visible: true, timeout: 5000 });

    console.log('Scorrimento fino al pulsante "Accedi"');
    await page.evaluate(() => {
      document.querySelector('button.anonymous--login--button').scrollIntoView();
    });

    await delay(1000);

    console.log('Clic sul pulsante "Accedi"');
    await page.click('button.anonymous--login--button');

    console.log('Attesa del campo username');
    await page.waitForSelector('input#login_username', { visible: true });

    console.log('Inserimento username');
    await page.type('input#login_username', config.lottomatica.username);

    console.log('Inserimento password');
    await page.type('input#login_password', config.lottomatica.password);

    console.log('Attesa del pulsante di accesso');
    await page.waitForSelector('button.login__panel--login__form--button--login', { visible: true });

    console.log('Scorrimento fino al pulsante di accesso');
    await page.evaluate(() => {
      document.querySelector('button.login__panel--login__form--button--login').scrollIntoView();
    });

    await delay(1000);

    console.log('Clic sul pulsante di accesso');
    await page.click('button.login__panel--login__form--button--login');

    console.log('Attesa della navigazione dopo il login');
    await page.waitForNavigation();

    const smsInputSelector = 'input.mat-input-element';
    const isSmsVerificationRequired = await page.$(smsInputSelector) !== null;

    if (isSmsVerificationRequired) {
      console.log('Verifica del dispositivo tramite SMS richiesta');

      try{
        const acceptCookiesSelector = 'button#onetrust-accept-btn-handler';
        await page.waitForSelector(acceptCookiesSelector, { visible: true });
        await page.click(acceptCookiesSelector);
        console.log('Pulsante per accettare i cookies cliccato.');
      }
      catch (error) {
          console.log('Errore durante il click sul pulsante per accettare i cookies.');
      }

      const smsCode = await new Promise((resolve) => {
        const rl = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl.question('Inserisci il codice ricevuto via SMS: ', (answer) => {
          rl.close();
          resolve(answer);
        });
      });

      console.log('Inserimento del codice SMS');
      await page.type(smsInputSelector, smsCode);

      await delay(4000);

      console.log('Ricerca del pulsante di conferma per il codice SMS');
      const confirmButtonSelector = 'button.mat-raised-button';

      const allButtons = await page.$$eval('button', buttons => buttons.map(b => ({text: b.textContent.trim(), class: b.className})));
      console.log('Pulsanti trovati sulla pagina:', JSON.stringify(allButtons, null, 2));

      await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.border = '3px solid green';
          element.style.boxShadow = '0 0 10px green';
        }
      }, confirmButtonSelector);

      console.log('Selettore utilizzato per il pulsante di conferma:', confirmButtonSelector);
      console.log('Clic sul pulsante di conferma');
      await page.click(confirmButtonSelector);

      console.log('Attesa della navigazione dopo la verifica del dispositivo');
      await page.waitForNavigation();
    }
  } catch (error) {
    console.log('Pulsante di login non trovato o errore durante il login:', error.message);
  }

  try {
    console.log('Attesa dell\'elemento del saldo');
    await page.waitForSelector('div.saldo--cash span[title="Saldo"]', { visible: true });

    console.log('Recupero del saldo');
    const saldo = await page.$eval('div.saldo--cash span[title="Saldo"]', el => el.textContent);

    console.log('Il tuo saldo è:', saldo);

    await saveCookies(page, 'lottomatica_cookies.json');
    await saveSessionData(page, 'lottomatica_session.json');

    await browser.close();
    return saldo;
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getLottomaticaBalance };
