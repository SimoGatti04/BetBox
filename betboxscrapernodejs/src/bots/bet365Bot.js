const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const config = require('../../config/config');
const { saveCookies, loadCookies } = require('../utils/cookies');
const { saveSessionData, loadSessionData } = require('../utils/session');

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// Funzione di attesa personalizzata
function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

// Funzione per muovere il mouse in modo realistico
async function moveMouse(page) {
  const width = await page.evaluate(() => window.innerWidth);
  const height = await page.evaluate(() => window.innerHeight);
  const x = Math.floor(Math.random() * width);
  const y = Math.floor(Math.random() * height);
  await page.mouse.move(x, y);
}

// Funzione per scorrere la pagina
async function scrollPage(page) {
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
  });
}

// Funzione per accettare i cookie
async function acceptCookies(page) {
  try {
    const cookieButtonSelector = 'div.ccm-CookieConsentPopup_Accept';
    await page.waitForSelector(cookieButtonSelector, { visible: true, timeout: 5000 });
    await page.click(cookieButtonSelector);
    console.log('Pulsante per accettare i cookie cliccato.');
  } catch (error) {
    console.log('Nessun pulsante per accettare i cookie trovato o errore durante il clic:', error);
  }
}

async function isUserLoggedIn(page) {
  try {
    // Verifica la presenza del pulsante di login
    const loginButtonSelector = 'button#header__logged-out-log-in-link';
    await page.waitForSelector(loginButtonSelector, { visible: true, timeout: 10000 }); // Timeout personalizzato di 10 secondi

    console.log('Pulsante "Login" trovato. Utente non loggato.');
    return false;
  } catch (error) {
    console.log('Utente già loggato o errore durante la verifica del pulsante "Login".');
    return true;
  }
}

async function getBet365Balance() {
  console.log('Inizio del processo di recupero del saldo da Bet365');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      //executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Specifica il percorso dell'eseguibile di Chrome
      args: [
        //'--incognito', // Aggiungi l'argomento per aprire il browser in modalità incognito
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu'
      ]
    });
    const context = browser.defaultBrowserContext();
    const page = await context.newPage();

    // Imposta un User-Agent realistico
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Aggiungi plugin ed estensioni comuni
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    console.log('Navigazione verso https://casino.bet365.it/home/it');
    await page.goto('https://casino.bet365.it/home/it', { waitUntil: 'networkidle0' });

    try {
      //await acceptCookies(page); // Accetta i cookie se presenti

      await loadCookies(page, 'bet365_cookies.json');
      await loadSessionData(page, 'bet365_session.json');

      await page.reload({ waitUntil: 'networkidle0' });

      const loggedIn = await isUserLoggedIn(page);

      if (!loggedIn) {
        console.log('Attesa del pulsante "Login"');
        const loginButtonSelector = 'button#header__logged-out-log-in-link';
        await page.waitForSelector(loginButtonSelector, { visible: true, timeout: 10000 }); // Timeout personalizzato di 10 secondi

        console.log('Clic sul pulsante "Login"');
        await page.click(loginButtonSelector);

        // Muovi il mouse in modo realistico
        await moveMouse(page);

        console.log('Attesa del campo username');
        await page.waitForSelector('input#txtUsername', { visible: true, timeout: 10000 }); // Timeout personalizzato di 10 secondi

        console.log('Inserimento username');
        await page.evaluate((username) => {
          document.querySelector('input#txtUsername').value = username;
        }, config.bet365.username);

        console.log('Attesa del campo password');
        await page.waitForSelector('input#txtPassword', { visible: true, timeout: 10000 }); // Timeout personalizzato di 10 secondi

        console.log('Inserimento password');
        await page.evaluate((password) => {
          document.querySelector('input#txtPassword').value = password;
        }, config.bet365.password);

        console.log('Attesa del pulsante di invio accesso');
        const submitButtonSelector = 'button.modal__button.login-modal-component__login-button';
        await page.waitForSelector(submitButtonSelector, { visible: true, timeout: 10000 }); // Timeout personalizzato di 10 secondi

        // Scorri la pagina
        await scrollPage(page);

        console.log('Clic sul pulsante di invio accesso');
        await page.click(submitButtonSelector);

        console.log('Attesa della navigazione dopo il login');
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }); // Timeout di 60 secondi

        console.log('Attesa dell\'elemento del saldo');
        const balanceSelector = 'div.regulatory-last-login-modal__balance-amount-value';
        await page.waitForSelector(balanceSelector, { visible: true, timeout: 10000 }); // Timeout personalizzato di 10 secondi

        console.log('Verifica del contenuto del saldo');
        const balanceHtml = await page.$eval(balanceSelector, el => el.outerHTML);
        console.log('Contenuto HTML del saldo:', balanceHtml);

        await saveCookies(page, 'bet365_cookies.json');
        await saveSessionData(page, 'bet365_session.json');

        console.log('Recupero del saldo');
        const saldo = await page.$eval(balanceSelector, el => el.textContent.trim());

        console.log('Il tuo saldo è:', saldo);

        await browser.close();
        return saldo;
      } else {
        console.log('Utente già loggato. Recupero del saldo dal menu utente.');

        const userMenuButtonSelector = 'button.members-dropdown-component__members-icon';
        const usernameSelector = 'div.members-dropdown-component__username';
        const balanceSelector = 'span.members-dropdown-component__total-balance-amount';

        console.log('Clic sul pulsante del menu utente');
        await page.click(userMenuButtonSelector);

        console.log('Attesa del nome utente nel menu');
        try{
          await page.waitForSelector(usernameSelector, { visible: true, timeout: 10000 }); // Timeout personalizzato di 10 secondi
        }
        catch (error) {
          console.log('Premo di nuovo il pulsante utente');
          await page.click(userMenuButtonSelector);
        }

        await page.waitForSelector(usernameSelector, { visible: true, timeout: 10000 }); // Timeout personalizzato di 10 secondi

          console.log('Attesa dell\'elemento del saldo nel menu');
        await page.waitForSelector(balanceSelector, { visible: true, timeout: 10000 }); // Timeout personalizzato di 10 secondi

        console.log('Recupero del saldo dal menu utente');
        const saldo = await page.$eval(balanceSelector, el => el.textContent.trim());

        console.log('Il tuo saldo è:', saldo);

        await saveCookies(page);
        await saveSessionData(page);

        await browser.close();
        return saldo;
      }
    } catch (error) {
      console.error('Errore durante il processo di recupero del saldo:', error);
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error('Errore durante il lancio del browser:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

module.exports = { getBet365Balance };
