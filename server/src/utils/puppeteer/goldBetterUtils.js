const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, waitForVerificationCode} = require('./botUtilsPuppeteer');
const config = require('../../../config/config');

const SITE_CONFIGS = {
  goldbet: {
    url: 'https://www.goldbet.it/',
    username: config.goldbet.username,
    password: config.goldbet.password
  },
  lottomatica: {
    url: 'https://www.lottomatica.it/',
    username: config.lottomatica.username,
    password: config.lottomatica.password
  }
};

async function acceptGoldBetterCookies(page) {
  try {
    const acceptCookiesSelector = 'button#onetrust-accept-btn-handler';
    await page.waitForSelector(acceptCookiesSelector, {state: 'visible', timeout: 15000});
    await page.click(acceptCookiesSelector);
    console.log('Pulsante per accettare i cookies cliccato.');
  } catch (error) {
    console.log('Errore durante l\'accettazione dei cookies.');
  }
}

async function goldBetterLogin(page, site) {
  const siteConfig = SITE_CONFIGS[site.toLowerCase()];
  let isUserLoggedIn = false;

  console.log(`Navigazione verso ${siteConfig.url}`);
  await page.goto(siteConfig.url , {timeout: 60000});

  try {
    await acceptGoldBetterCookies(page);
    console.log('Attesa del pulsante "Accedi"');
    await page.waitForSelector('button.anonymous--login--button', {state: 'visible', timeout: 30000});
  } catch (error) {
    isUserLoggedIn = true;
    console.log('Utente già loggato o errore durante la verifica del pulsante "Accedi".');
  }

  if (!isUserLoggedIn) {
    console.log('Clic sul pulsante "Accedi"');
    await page.waitForSelector('button.anonymous--login--button')
    await page.click('button.anonymous--login--button');

    console.log("Inserimento username e password");
    await page.waitForSelector('input#login_username', {state: 'visible'});
    await simulateTyping(page, 'input#login_username', siteConfig.username);
    await simulateTyping(page, 'input#login_password', siteConfig.password);
    await page.waitForSelector('button.login__panel--login__form--button--login', {state: 'visible'});
    await page.evaluate(() => {
      document.querySelector('button.login__panel--login__form--button--login').scrollIntoView();
    });
    await delay(1000, 2000);
    await page.click('button.login__panel--login__form--button--login');

    await delay(5000, 10000);
    const smsInputSelector = 'input.mat-input-element';
    await delay (2000,3000);
    try{
      await page.waitForSelector(smsInputSelector, {timeout: 30000});
    } catch (error) {
      console.log('Finestra SMS non trovata');
    }
    const isSmsVerificationRequired = await page.$(smsInputSelector) !== null;

    if (isSmsVerificationRequired) {
      console.log('Finestra di verifica SMS trovata');
      const verificationCode = await waitForVerificationCode();
      await simulateTyping(page, smsInputSelector, verificationCode);
      await delay(2000, 3000);
      console.log('Clic sul pulsante di conferma');
      const confirmButtonSelector = `//button[.//span[contains(text(),'CONFERMA')]]`;
      await page.click(`xpath=${confirmButtonSelector}`);
      await page.waitForNavigation();
    }
  }

  return 'LOGIN_SUCCESSFUL';
}


async function extractBonusType(page) {
  try {
    const bonusDiv = await page.waitForSelector('.testoVincitaRuota', { timeout: 20000 });
    const bonusText = await bonusDiv.evaluate(el => el.textContent);
    const bonusLines = bonusText.split('\n');
    let bonusType;
    if (bonusLines.length > 1) {
      bonusType = bonusLines[1].trim();
    } else {
      bonusType = bonusText.replace("COMPLIMENTI HAI VINTO UN ", "").trim();
    }
    return bonusType;
  } catch (error) {
    console.error(`Error: ${error}`);
    return null;
  }
}


async function extractBonusValue(page) {
  try {
    const bonusDiv = await page.waitForSelector('#valoreVincitaRuota', { timeout: 20000 });
    const images = await bonusDiv.evaluate(div => {
      return Array.from(div.querySelectorAll('img')).map(img => img.src);
    });

    const valueParts = [];
    for (const src of images) {
      const fileName = src.split('/').pop().replace('.png', '');
      if (src.includes('numeri')) {
        if (fileName === 'virgola') {
          valueParts.push('.');
        } else if (fileName === 'euro') {
          valueParts.push(' €');
        } else {
          valueParts.push(fileName);
        }
      }
    }
    return valueParts.join('');
  } catch (error) {
    console.error(`Error: ${error}`);
    return null;
  }
}


module.exports = { goldBetterLogin, acceptGoldBetterCookies, extractBonusValue, extractBonusType };
