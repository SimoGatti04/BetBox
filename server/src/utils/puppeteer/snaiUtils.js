const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser} = require('./botUtils');
const config = require('../../../config/config');

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
  await page.goto('https://www.snai.it/', {timeout: 60000});

  await acceptSnaiCookies(page);

  try {
    console.log('Attesa del pulsante "Accedi"');
    await page.waitForSelector('button.Header_btnLogin__O68th', { state: 'visible', timeout: 30000 });
  } catch (error) {
    console.log('Pulsante accedi non trovato: ', error);
    await page.reload()
    try {
      console.log('Attesa del pulsante "Accedi"');
      await page.waitForSelector('button.Header_btnLogin__O68th', { state: 'visible', timeout: 30000 });
    } catch (error) {
        console.log('Pulsante accedi non trovato: ', error);
        isUserLoggedIn = true;
    }
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
    await page.click('div.Button_childrenContainer__YUfnj', {timeout: 120000});

    await delay (4000, 5000);

  }
  console.log('Clic sul pulsante dashboard');
  const loginButton = await page.$('div.UserNavigation_btnLinkContainer__Lc20b button.UserNavigation_btnLink__vk3Hf');

  if (loginButton){
    await page.click('div.UserNavigation_btnLinkContainer__Lc20b button.UserNavigation_btnLink__vk3Hf', {timeout: 120000});
  }
}

module.exports = { snaiLogin, acceptSnaiCookies}