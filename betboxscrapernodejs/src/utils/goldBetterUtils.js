const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping } = require('./botUtils');
const config = require('../../config/config');

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

async function setupGoldBetterBrowser(page, site) {
  const siteConfig = SITE_CONFIGS[site.toLowerCase()];
  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'it-IT,it;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.google.it/',
      'DNT': '1'
    });

    console.log(`Navigazione verso ${siteConfig.url}`);
    await page.goto(siteConfig.url, {waitUntil: 'networkidle'});
  } catch (error) {
    console.log(`Errore durante la navigazione verso ${site}: ${error}`);
  }
  return page;
}

async function acceptGoldBetterCookies(page) {
  try {
    const acceptCookiesSelector = 'button#onetrust-accept-btn-handler';
    await page.waitForSelector(acceptCookiesSelector, {state: 'visible', timeout: 7500});
    await page.click(acceptCookiesSelector);
    console.log('Pulsante per accettare i cookies cliccato.');
  } catch (error) {
    console.log('Errore durante l\'accettazione dei cookies.');
  }
}

async function goldBetterLogin(page, site) {
  const siteConfig = SITE_CONFIGS[site.toLowerCase()];
  let isUserLoggedIn = false;
  try {
    console.log('Attesa del pulsante "Accedi"');
    await page.waitForSelector('button.anonymous--login--button', {state: 'visible', timeout: 5000});
  } catch (error) {
    isUserLoggedIn = true;
    console.log('Utente già loggato o errore durante la verifica del pulsante "Accedi".');
  }

  if (!isUserLoggedIn) {
    console.log('Clic sul pulsante "Accedi"');
    await page.click('button.anonymous--login--button');

    console.log('Attesa del campo username');
    await page.waitForSelector('input#login_username', {state: 'visible'});

    console.log('Inserimento username');
    await simulateTyping(page, 'input#login_username', siteConfig.username);

    console.log('Inserimento password');
    await simulateTyping(page, 'input#login_password', siteConfig.password);

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

      await acceptGoldBetterCookies(page);

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
}

async function extractBonusType(page) {
  try {
    const bonusDiv = await page.waitForSelector('.testoVincitaRuota', { timeout: 20000 });
    const bonusText = await bonusDiv.textContent();
    const bonusLines = bonusText.split('\n');
    let bonusType;
    if (bonusLines.length > 1) {
      bonusType = bonusLines[1];
    } else {
      bonusType = bonusText.replace("COMPLIMENTI HAI VINTO UN ", "");
    }
    return bonusType;
  } catch (error) {
    console.error(`Error: ${error}`);
    await page.context().browser().close();
    return null;
  }
}

async function extractBonusValue(page) {
  try {
    const bonusDiv = await page.waitForSelector('#valoreVincitaRuota', { timeout: 20000 });
    const images = await bonusDiv.$$('img');
    const valueParts = [];
    for (const img of images) {
      const src = await img.getAttribute('src');
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
    await page.context().browser().close();
    return null;
  }
}

module.exports = { setupGoldBetterBrowser, goldBetterLogin, acceptGoldBetterCookies, extractBonusValue, extractBonusType };
