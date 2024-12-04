const { chromium, firefox, webkit } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const path = require('path');
const fs = require('fs');
const { headless, browsers } = require('../../config.js');

chromium.use(stealth);

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
];

function getSessionFile(botName) {
  return path.join(__dirname, '..', '..', 'sessions', `${botName}_session.json`);
}

async function delay(min, max) {
  const time = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise(resolve => setTimeout(resolve, time));
}

async function simulateHumanBehavior(page) {
  const { width, height } = page.viewportSize();
  await smoothMouseMove(page, Math.random() * width, Math.random() * height);
}

async function smoothMouseMove(page, x, y) {
  const steps = 10;
  const currentPosition = await page.evaluate(() => ({ x: window.mouseX || 0, y: window.mouseY || 0 }));
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      currentPosition.x + (x - currentPosition.x) * (i / steps),
      currentPosition.y + (y - currentPosition.y) * (i / steps)
    );
    await delay(10, 20);
  }
}

async function simulateTyping(page, selector, text) {
  await page.focus(selector);
  await page.keyboard.type(text, { delay: Math.floor(Math.random() * 100) + 50 });
}

async function setupBrowser(botName) {
  console.log(`Inizializzazione del browser per ${botName}`);

    const browserMap = {
        'chromium': chromium,
        'firefox': firefox,
        'webkit': webkit
    };

    const browserType = browserMap[browsers?.[botName]] || chromium;

    console.log(`Avvio di ${browsers?.[botName] || 'chromium'}...`);
    let browser;
    if (botName==="snai"){
        browser = await webkit.launch({
        headless: headless,
        args: [
          '--disable-gpu',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled'
        ]
      });
    } else {
        browser = await chromium.launch({
        headless: headless,
        args: [
          '--disable-gpu',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled'
        ]
      });
    }
  console.log('Browser avviato con successo');

  const sessionFile = getSessionFile(botName);
  console.log(`File di sessione: ${sessionFile}`);

  console.log('Selezione dello User-Agent...');
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  console.log(`User-Agent selezionato: ${userAgent}`);

  let context;
  if (fs.existsSync(sessionFile)) {
      console.log('File di sessione esistente trovato, caricamento...');
      const fullSession = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

      let storageState = fullSession;

      switch(botName) {
          case 'goldbet':
              storageState = filterGoldbetSession(fullSession);
              break;
          case 'lottomatica':
              storageState = filterLottomaticaSession(fullSession);
              break;
          case 'snai':
              storageState = filterSnaiSession(fullSession);
              break;
      }

      context = await browser.newContext({
          storageState: storageState,
          userAgent: userAgent,
          ...(record ? {
              recordVideo: {
                  dir: './recordings',
                  size: {width: 1240, height: 1080}
              }
          } : {})
      });
      console.log(`Contesto creato per ${botName}`);
  } else {
      context = await browser.newContext({
          userAgent: userAgent,
          ...(record ? {
              recordVideo: {
                  dir: './recordings',
                  size: {width: 1240, height: 1080}
              }
          } : {})
      });
      console.log('Nuovo contesto creato');
  }



  console.log('Creazione di una nuova pagina...');
  const page = await context.newPage();
  console.log('Nuova pagina creata');

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'it-IT,it;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.google.it/',
    'DNT': '1'
  });

  console.log(`Setup del browser completato per ${botName}`);
  return { browser, context, page };
}

function filterGoldbetSession(fullSession) {
    const essentialCookies = fullSession.cookies.filter(cookie =>
        cookie.name === 'jIDsession' ||
        cookie.name === 'persist_website'
    );

    const essentialStorage = {
        origins: [{
            origin: 'https://www.goldbet.it',
            localStorage: fullSession.origins[0].localStorage.filter(item =>
                item.name === 'authData'
            )
        }]
    };

    return {
        cookies: essentialCookies,
        ...essentialStorage
    };
}

function filterLottomaticaSession(fullSession) {
    const essentialCookies = fullSession.cookies.filter(cookie =>
        cookie.name === 'jIDsession' ||
        cookie.name === 'c_prof'
    );

    const essentialStorage = {
        origins: [{
            origin: 'https://www.lottomatica.it',
            localStorage: fullSession.origins[0].localStorage.filter(item =>
                item.name === 'authData'
            )
        }]
    };

    return {
        cookies: essentialCookies,
        ...essentialStorage
    };
}

function filterSnaiSession(fullSession) {
    const essentialCookies = fullSession.cookies.filter(cookie =>
        cookie.name === '__it-snai-auth:token' ||
        cookie.name === '__it-snai-auth:logged' ||
        cookie.name === '__it-snai:token'
    );

    const essentialStorage = {
        origins: [{
            origin: 'https://www.snai.it',
            localStorage: fullSession.origins[0].localStorage.filter(item =>
                item.name === 'snai-token' ||
                item.name === 'snai-carta'
            )
        }]
    };

    return {
        cookies: essentialCookies,
        ...essentialStorage
    };
}



module.exports = {
  delay,
  simulateHumanBehavior,
  smoothMouseMove,
  simulateTyping,
  setupBrowser,
  getSessionFile
};