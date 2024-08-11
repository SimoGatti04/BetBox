const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile } = require('../utils/botUtils');
const config = require('../../config/config');

async function getBet365Balance() {
  console.log('Inizio del processo di recupero del saldo da Bet365');

  const { browser, context, page } = await setupBrowser('bet365');
  let saldo = 0;

  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'it-IT,it;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.google.com/',
      'DNT': '1'
    });

    await page.goto('https://casino.bet365.it', { waitUntil: 'networkidle', timeout: 60000 });
    await delay(2000, 5000);

    const loginButton = await page.$('button#header__logged-out-log-in-link');
    const isLoggedIn = !loginButton;

    if (!isLoggedIn) {
      console.log('Utente non loggato. Eseguo il login.');
      await simulateHumanBehavior(page);
      await loginButton.click();
      await delay(1000, 2000);

      // Utilizzo di smoothMouseMove prima di inserire le credenziali
      const { width, height } = await page.viewportSize();
      await smoothMouseMove(page, width / 2, height / 2);

      await simulateTyping(page, 'input#txtUsername', config.bet365.username);
      await delay(500, 1500);
      await simulateTyping(page, 'input#txtPassword', config.bet365.password);
      await delay(1000, 2000);

      await simulateHumanBehavior(page);
      await page.click('button.modal__button.login-modal-component__login-button');
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 });

      await context.storageState({ path: getSessionFile('bet365') });

      console.log('Recupero del saldo');
      const balanceSelector = 'div.regulatory-last-login-modal__balance-amount-value';
      await page.waitForSelector(balanceSelector, { timeout: 30000 });
      await delay(1000, 3000);
      saldo = await page.$eval(balanceSelector, el => el.textContent.trim());
      console.log('Il tuo saldo è:', saldo);
    }
    else {
      const userMenuButtonSelector = 'button.members-dropdown-component__members-icon';
      console.log('Utente già loggato. Recupero del saldo dal menu utente.');

      // Clic sul pulsante del menu utente
      await page.click(userMenuButtonSelector);

      // Attesa del caricamento del menu
      await page.waitForSelector('span.members-dropdown-component__total-balance-amount', { state: 'visible' });

      // Recupero del saldo
      saldo = await page.$eval('span.members-dropdown-component__total-balance-amount', el => el.textContent.trim());

      console.log('Il tuo saldo è:', saldo);
    }

    await context.storageState({ path: getSessionFile('bet365') });
    await browser.close();
    return saldo;
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getBet365Balance };
