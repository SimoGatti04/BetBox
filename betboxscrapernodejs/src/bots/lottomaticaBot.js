const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile } = require('../utils/botUtils');
const config = require('../../config/config');

async function getLottomaticaBalance() {
  console.log('Inizio del processo di recupero del saldo da Lottomatica');

  const { browser, context, page } = await setupBrowser('lottomatica');
  let isUserLoggedIn = false;

  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'it-IT,it;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.google.it/',
      'DNT': '1'
    });

    console.log('Navigazione verso https://www.lottomatica.it/');
    await page.goto('https://www.lottomatica.it/', {waitUntil: 'networkidle'});

    try {
      console.log('Attesa del pulsante "Accedi"');
      await page.waitForSelector('button.anonymous--login--button', {state: 'visible', timeout: 5000});
    } catch (error) {
      isUserLoggedIn = true
      console.log('Utente già loggato o errore durante la verifica del pulsante "Accedi".');
    }

    if (!isUserLoggedIn) {
      console.log('Clic sul pulsante "Accedi"');
      await page.click('button.anonymous--login--button');

      console.log('Attesa del campo username');
      await page.waitForSelector('input#login_username', {state: 'visible'});

      console.log('Inserimento username');
      await simulateTyping(page, 'input#login_username', config.lottomatica.username);

      console.log('Inserimento password');
      await simulateTyping(page, 'input#login_password', config.lottomatica.password);

      console.log('Attesa del pulsante di accesso');
      await page.waitForSelector('button.login__panel--login__form--button--login', {state: 'visible'});

      console.log('Scorrimento fino al pulsante di accesso');
      await page.evaluate(() => {
        document.querySelector('button.login__panel--login__form--button--login').scrollIntoView();
      });

      await delay(1000, 2000);

      console.log('Clic sul pulsante di accesso');
      await page.click('button.login__panel--login__form--button--login');

      console.log('Attesa della navigazione dopo il login');
      await page.waitForNavigation();

      console.log('Ricerca della finestra di verifica SMS');
      await delay(5000, 10000);
      const smsInputSelector = 'input.mat-input-element';
      const isSmsVerificationRequired = await page.$(smsInputSelector) !== null;

      if (isSmsVerificationRequired) {
        console.log('Finestra di verifica SMS trovata');
        console.log('Selettore utilizzato:', smsInputSelector);

        await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (element) {
            element.style.border = '3px solid red';
          }
        }, smsInputSelector);

        try {
          const acceptCookiesSelector = 'button#onetrust-accept-btn-handler';
          await page.waitForSelector(acceptCookiesSelector, {state: 'visible'});
          await page.click(acceptCookiesSelector);
          console.log('Pulsante per accettare i cookies cliccato.');
        } catch (error) {
          console.log('Errore durante l\'accettazione dei cookies.');
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
        await simulateTyping(page, smsInputSelector, smsCode);

        await delay(2000, 3000);

        console.log('Clic sul pulsante di conferma');
        const confirmButtonSelector = 'button:has-text("CONFERMA")';
        await page.click(confirmButtonSelector);

        console.log('Attesa della navigazione dopo la verifica del dispositivo');
        await page.waitForNavigation();
      } else {
        console.log('Finestra di verifica SMS non trovata');
      }
    }
    console.log('Attesa dell\'elemento del saldo');
    await page.waitForSelector('div.saldo--cash span[title="Saldo"]', { state: 'visible' });

    console.log('Recupero del saldo');
    const saldo = await page.$eval('div.saldo--cash span[title="Saldo"]', el => el.textContent);

    console.log('Il tuo saldo è:', saldo);

    await context.storageState({ path: getSessionFile('lottomatica') });
    await browser.close();
    return saldo;
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getLottomaticaBalance };
