const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile, saveSession} = require('../../utils/botUtils');
const config = require('../../../config/config');
const fs = require("fs");

async function getBet365Balance() {
  console.log('Inizio del processo di recupero del saldo da Bet365');

  const { browser, page } = await setupBrowser('bet365');
  let saldo = 0;

  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'it-IT,it;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.google.com/',
      'DNT': '1'
    });

    await page.goto('https://casino.bet365.it');
    await delay(2000, 5000);

    const loginButton = await page.$('button#header__logged-out-log-in-link');
    const isLoggedIn = !loginButton;

    if (!isLoggedIn) {
      console.log('Utente non loggato. Eseguo il login.');
      await simulateHumanBehavior(page);
      await loginButton.click();
      await delay(1000, 2000);

      const viewport = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight
      }));
      await smoothMouseMove(page, viewport.width / 2, viewport.height / 2);

      await simulateTyping(page, 'input#txtUsername', config.bet365.username);
      await delay(500, 1500);
      await simulateTyping(page, 'input#txtPassword', config.bet365.password);
      await delay(1000, 2000);

      await simulateHumanBehavior(page);
      await page.click('button.modal__button.login-modal-component__login-button');
      await delay(5000, 8000);

      console.log('Recupero del saldo');
      await page.waitForSelector('div.regulatory-last-login-modal__balance-amount-value');
      await delay(1000, 3000);
      saldo = await page.evaluate(() =>
        document.querySelector('div.regulatory-last-login-modal__balance-amount-value').textContent.trim()
      );
      console.log('Il tuo saldo è:', saldo);
    }
    else {
      const userMenuButtonSelector = 'button.members-dropdown-component__members-icon';
      console.log('Utente già loggato. Recupero del saldo dal menu utente.');

      await page.click(userMenuButtonSelector);
      await delay(2000, 3000);

      await page.waitForSelector('span.members-dropdown-component__total-balance-amount');
      saldo = await page.evaluate(() =>
        document.querySelector('span.members-dropdown-component__total-balance-amount').textContent.trim()
      );

      await saveSession(page, 'bet365');

      console.log('Il tuo saldo è:', saldo);
    }

    await browser.close();
    return saldo;
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getBet365Balance };
