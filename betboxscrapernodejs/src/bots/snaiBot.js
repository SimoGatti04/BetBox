const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile } = require('../utils/botUtils');
const config = require('../../config/config');

async function acceptCookies(page) {
  try {
    const cookieButtonSelector = 'button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll';
    await page.waitForSelector(cookieButtonSelector, { state: 'visible', timeout: 15000 });
    await page.click(cookieButtonSelector);
    console.log('Pulsante per accettare i cookies cliccato.');
  } catch (error) {
    console.log('Nessun pulsante per accettare i cookies trovato o errore durante il clic:', error);
  }
}

async function getSnaiBalance() {
  console.log('Inizio del processo di recupero del saldo da Snai');

  const { browser, context, page } = await setupBrowser('snai');

  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'it-IT,it;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.google.it/',
      'DNT': '1'
    });

    console.log('Navigazione verso https://www.snai.it/');
    await page.goto('https://www.snai.it/', { waitUntil: 'networkidle' });

    await acceptCookies(page);

    console.log('Attesa del pulsante "Accedi"');
    await page.waitForSelector('button.Header_btnLogin__O68th', { state: 'visible', timeout: 5000 });

    console.log('Clic sul pulsante "Accedi"');
    await page.click('button.Header_btnLogin__O68th');

    console.log('Attesa del campo username');
    await page.waitForSelector('input[name="username"]', { state: 'visible' });

    console.log('Inserimento username');
    await simulateTyping(page, 'input[name="username"]', config.snai.username);

    console.log('Inserimento password');
    await simulateTyping(page, 'input[name="password"]', config.snai.password);

    console.log('Attesa del pulsante di invio accesso');
    await page.waitForSelector('div.Button_childrenContainer__YUfnj', { state: 'visible' });

    console.log('Clic sul pulsante di invio accesso');
    await page.click('div.Button_childrenContainer__YUfnj');

    await delay(3000);

    console.log('Attesa del pulsante per accedere al saldo');
    await page.waitForSelector('button.UserNavigation_btnLink__vk3Hf', { state: 'visible', timeout: 60000 });

    console.log('Clic sul pulsante per accedere al saldo');
    await page.click('button.UserNavigation_btnLink__vk3Hf');

    await delay(3000);

    console.log('Attesa dell\'elemento del saldo');
    await page.waitForSelector('p.MyAccount_text__yOR_J', { state: 'visible' });

    console.log('Recupero del saldo');
    const saldo = await page.$eval('p.MyAccount_text__yOR_J', el => el.textContent.trim());

    console.log('Il tuo saldo è:', saldo);

    await context.storageState({ path: getSessionFile('snai') });
    await browser.close();
    return saldo;
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getSnaiBalance };
