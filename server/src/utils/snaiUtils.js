const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping} = require('../utils/botUtils');
const config = require('../../config/config');

async function acceptSnaiCookies(page) {
  try {
    const cookieButtonSelector = 'button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll';
    await page.waitForSelector(cookieButtonSelector, { state: 'visible', timeout: 30000 });
    await page.click(cookieButtonSelector);
    console.log('Pulsante per accettare i cookies cliccato.');
  } catch (error) {
    console.log('Nessun pulsante per accettare i cookies trovato o errore durante il clic:', error);
  }
}

async function snaiLogin(page){
  let isUserLoggedIn = false;

  console.log('Navigazione verso https://www.snai.it/');
  await page.goto('https://www.snai.it/', {timeout: 120000});

  await acceptSnaiCookies(page);

  await Promise.race([
    page.waitForLoadState('networkidle', { timeout: 120000 }),
    page.waitForLoadState('domcontentloaded', { timeout: 120000 })
  ]);

  try {
    console.log('Attesa del pulsante "Accedi"');
    await page.waitForSelector('button.Header_btnLogin__O68th', { state: 'visible', timeout: 120000 });
  } catch (error) {
    console.log('Pulsante accedi non trovato: ', error);
    await page.reload()
    try {
      console.log('Attesa del pulsante "Accedi"');
      await page.waitForSelector('button.Header_btnLogin__O68th', { state: 'visible', timeout: 120000 });
    } catch (error) {
        console.log('Pulsante accedi non trovato: ', error);
        isUserLoggedIn = true;
    }
  }

  if (!isUserLoggedIn){
    try{
      console.log('Clic sul pulsante "Accedi"');
      await page.locator('button.Header_btnLogin__O68th').waitFor({ state: 'visible', timeout: 10000});
      await page.click('button.Header_btnLogin__O68th', {timeout: 10000});
    } catch (error) {
      console.log('Errore durante il clic sul pulsante "Accedi": ', error);
      isUserLoggedIn = true;
    }
    if (!isUserLoggedIn) {
      console.log('Attesa del campo username');
      await page.waitForSelector('input[name="username"]', {state: 'visible'});

      console.log('Inserimento username');
      await simulateTyping(page, 'input[name="username"]', config.snai.username);

      console.log('Inserimento password');
      await simulateTyping(page, 'input[name="password"]', config.snai.password);

      console.log('Attesa del pulsante di invio accesso');
      await page.waitForSelector('div.Button_childrenContainer__YUfnj', {state: 'visible'});

      console.log('Clic sul pulsante di invio accesso');
      await page.click('div.Button_childrenContainer__YUfnj', {timeout: 10000});

      await delay(3000, 4000);
    }
  }
  console.log('Clic sul pulsante dashboard');
  await page.waitForSelector('div.UserNavigation_btnLinkContainer__Lc20b button.UserNavigation_btnLink__vk3Hf', {timeout: 120000});
  await page.click('div.UserNavigation_btnLinkContainer__Lc20b button.UserNavigation_btnLink__vk3Hf');
}

module.exports = { snaiLogin, acceptSnaiCookies}