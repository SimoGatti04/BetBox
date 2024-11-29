const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile,
  caseInsensitiveXPath, saveSession
} = require('../../utils/botUtils');
const config = require('../../../config/config');
const fs = require('fs')

async function acceptCookies(page) {
  try {
    await page.waitForSelector('button.iubenda-cs-accept-btn.iubenda-cs-btn-primary', { state: 'visible', timeout: 5000 });
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
    await simulateTyping(page, 'input[name="username"]', config.cplay.username);
    await simulateTyping(page, 'input[name="password"]', config.cplay.password);

    await page.click('button.buttons.button--primary.button--large.ng-star-inserted');
    await delay(5000,6000);
  } catch (error) {
      console.log('Login già eseguito o errore durante il login', error);
  }
}

async function handleDeviceVerification(page) {
  try {
    await page.waitForSelector(caseInsensitiveXPath("span", "autorizza il dispositivo"), { timeout: 10000 });
    const verificationText = await page.$eval(caseInsensitiveXPath("span", "autorizza il dispositivo"), el => el.textContent);

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
      await page.waitForSelector(caseInsensitiveXPath("core-button/button/content", "ricevuta!"), { state: 'visible', timeout: 20000 });
      await page.click(caseInsensitiveXPath("core-button/button/content", "ricevuta!"));
      console.log('Pulsante "Ricevuta!" cliccato');

      await delay(2000, 4000);
      await page.waitForSelector('input[name="username"]');
      await simulateTyping(page, 'input[name="username"]', config.cplay.username);
      await simulateTyping(page, 'input[name="password"]', config.cplay.password);

      await page.click('button.buttons.button--primary.button--large.ng-star-inserted');
      await delay(5000, 6000);
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
  console.log('Inizio del processo di recupero del saldo da Cplay');

  const { browser, context, page } = await setupBrowser('cplay');

  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'it-IT,it;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.google.it/',
      'DNT': '1'
    });

    await page.goto('https://www.cplay.it', { waitUntil: 'networkidle0', timeout: 120000 });

    await delay(4000, 6000);
    await acceptCookies(page);

    await login(page);

    await simulateHumanBehavior(page);

    await handleDeviceVerification(page);

    const balance = await getBalance(page);
    console.log('Saldo Cplay:', balance);

    await saveSession(page, 'cplay');

    await browser.close();
    return balance;
  } catch (error) {
    console.error('Errore durante il recupero del saldo Cplay:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getCplayBalance };