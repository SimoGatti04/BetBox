const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping} = require('../utils/botUtils');
const config = require('../../config/config');
const {setupBrowser} = require("./botUtils");

async function acceptSnaiCookies(page) {
  try {
    const cookieButtonSelector = 'button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll';
    await page.waitForSelector(cookieButtonSelector, { state: 'visible', timeout: 10000 });
    await page.click(cookieButtonSelector);
    console.log('Pulsante per accettare i cookies cliccato.');
  } catch (error) {
    console.log('Nessun pulsante per accettare i cookies trovato o errore durante il clic:', error);
  }
}

async function snaiLogin(page){
  let isUserLoggedIn = false;

  console.log('Navigazione verso https://www.snai.it/');
  await page.goto('https://www.snai.it/', {waitUntil: 'networkidle', timeout: 60000});

  await acceptSnaiCookies(page);

  try {
    console.log('Attesa del pulsante "Accedi"');
    await page.waitForSelector('button.Header_btnLogin__O68th', { state: 'visible', timeout: 10000 });
  } catch (error) {
    console.log('Pulsante accedi non trovato: ', error);
    isUserLoggedIn = true
  }

  if (!isUserLoggedIn){
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
  }
}

module.exports = { snaiLogin, acceptSnaiCookies}