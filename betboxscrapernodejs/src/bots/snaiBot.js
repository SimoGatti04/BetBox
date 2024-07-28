const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const config = require('../../config/config');
const { saveCookies, loadCookies } = require('../utils/cookies');
const { saveSessionData, loadSessionData } = require('../utils/session');

// Usa i plugin di stealth e adblocker
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// Funzione di attesa personalizzata
function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

async function acceptCookies(page) {
  try {
    const cookieButtonSelector = 'button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll';
    await page.waitForSelector(cookieButtonSelector, { visible: true , timeout: 15000});
    await page.click(cookieButtonSelector);
    console.log('Pulsante per accettare i cookies cliccato.');
  } catch (error) {
    console.log('Nessun pulsante per accettare i cookies trovato o errore durante il clic:', error);
  }
}

async function getSnaiBalance() {
  console.log('Inizio del processo di recupero del saldo da Snai');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
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
  const page = await browser.newPage();

  // Imposta un User-Agent che simuli un browser reale
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  console.log('Navigazione verso https://www.snai.it/');
  await page.goto('https://www.snai.it/', { waitUntil: 'networkidle2' });

  try {
    await loadCookies(page, 'snai_cookies.json');
    await loadSessionData(page, 'snai_session.json');
    await page.reload();

    await acceptCookies(page);

    try{

      console.log('Attesa del pulsante "Accedi"');
      await page.waitForSelector('button.Header_btnLogin__O68th', { visible: true, timeout: 5000 });

      console.log('Clic sul pulsante "Accedi"');
      await page.click('button.Header_btnLogin__O68th');

      console.log('Attesa del campo username');
      await page.waitForSelector('input[name="username"]', { visible: true });

      console.log('Inserimento username');
      await page.type('input[name="username"]', config.snai.username);

      console.log('Inserimento password');
      await page.type('input[name="password"]', config.snai.password);

      console.log('Attesa del pulsante di invio accesso');
      await page.waitForSelector('div.Button_childrenContainer__YUfnj', { visible: true });

      console.log('Clic sul pulsante di invio accesso');
      await page.click('div.Button_childrenContainer__YUfnj');

      await delay(3000);
    } catch (error) {
        console.log('Nessun pulsante di invio accesso trovato o errore durante il clic:', error);
    }

    console.log('Attesa del pulsante per accedere al saldo');
    await page.waitForSelector('button.UserNavigation_btnLink__vk3Hf', { visible: true, timeout: 60000 }); // Aggiungi un timeout di 60 secondi

    console.log('Clic sul pulsante per accedere al saldo');
    await page.click('button.UserNavigation_btnLink__vk3Hf');

    await delay(3000);

    console.log('Attesa dell\'elemento del saldo');
    await page.waitForSelector('p.MyAccount_text__yOR_J', { visible: true });

    await saveCookies(page, 'snai_cookies.json');
    await saveSessionData(page, 'snai_session.json');

    console.log('Recupero del saldo');
    const saldo = await page.$eval('p.MyAccount_text__yOR_J', el => el.textContent.trim());

    console.log('Il tuo saldo è:', saldo);

    await browser.close();
    return saldo;
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getSnaiBalance };
