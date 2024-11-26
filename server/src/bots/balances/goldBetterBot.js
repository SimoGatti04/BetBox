const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile, saveSession} = require('../../utils/botUtils');
const { goldBetterLogin } = require('../../utils/goldBetterUtils');
const EventEmitter = require('events');
const verificationEmitter = new EventEmitter();
const config = require('../../../config/config');
const WebSocket = require('ws');
const fs = require("fs");

async function getGoldBetterBalance(site) {
  console.log(`Inizio del processo di recupero del saldo da ${site}`);
  const { browser, context, page} = await setupBrowser(site);

  try {
    const loginResult = await goldBetterLogin(page, site);
    if (loginResult === 'SMS_VERIFICATION_REQUIRED') {
      console.log(`Invio richiesta di verifica SMS per ${site}`);
      global.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'VERIFICATION_REQUIRED',
            site: site,
            verificationType: 'SMS'
          }));
        }
      });
      console.log(`Verifica SMS richiesta. In attesa del codice dall'app...`);
      await new Promise(resolve => verificationEmitter.once(`smsCode:${site}`, resolve));
      console.log(`Codice ricevuto, continuo con il recupero del saldo`);
    }

    console.log('Attesa dell\'elemento del saldo');
    await page.waitForSelector('div.saldo--cash span[title="Saldo"]', { state: 'visible' });

    console.log('Recupero del saldo');
    const saldo = await page.$eval('div.saldo--cash span[title="Saldo"]', el => el.textContent);

    console.log(`Il tuo saldo su ${site} è:`, saldo);

    await saveSession(page, `${site}`);

    await browser.close();
    return saldo;
  } catch (error) {
    console.error(`Errore durante il processo di recupero del saldo su ${site}:`, error);
    await browser.close();
    throw error;
  }
}

verificationEmitter.on('smsCode', async (site, code) => {
  console.log(`Codice ricevuto per ${site}: ${code}`);
  const { browser, context, page } = await setupBrowser(site.toLowerCase());
  await setupBrowser(site);
  await inserisciCodiceVerifica(page, code);
  await cliccaPulsanteConferma(page);
});

async function inserisciCodiceVerifica(page, code) {
  await page.type('input.mat-input-element', code);
}

async function cliccaPulsanteConferma(page) {
  await page.click('button:has-text("CONFERMA")');
}

module.exports = { getGoldBetterBalance, verificationEmitter };
