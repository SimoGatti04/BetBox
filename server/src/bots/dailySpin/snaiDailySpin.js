const { delay, setupBrowser } = require('../../utils/botUtils');
const config = require('../../../config/config');
const { updateSpinHistory} = require("../../utils/dailySpinUtils");

async function spinSnaiWheel() {
  console.log('Inizio del processo per il daily spin di Snai');

  const { browser, context, page } = await setupBrowser('snai');
  let bonusInfo = null;

  try {
    console.log ("Vado alla pagina dello spin di Snai")
    await page.goto("https://www.snaigiochi.it/casual/login/?skin=SNAI&mobile=1&gioco=DAILYSPIN&a=oooo&openExtMode=1&id_network=1&prodotto=casual");

    await delay(3000, 4000);

    console.log("Cerco l'input per l\'username");
    await page.waitForSelector('input[name="username"]')

    console.log("Inserisco l'username");
    await page.fill('input[name="username"]', config.snai.username);

    console.log("Cerco l'input per la password");
    await page.waitForSelector('input[name="pass"]')

    console.log("Inserisco la password");
    await page.fill('input[name="pass"]', config.snai.password);

    console.log("Cerco il pulsante di login");
    await page.waitForSelector('div#accedi_click_MONEY')

    console.log("Clicco sul pulsante di login");
    await page.click('div#accedi_click_MONEY');

    await delay(7000, 8000);

    console.log("Ricarico la pagina");
    await page.reload();

    await delay(4000, 5000);

    console.log("Controllo del risultato dello spin");
    const divs = await page.$$('div[id^="popup_estratto_"]');
    const backgroundImages = await Promise.all(divs.map(div => div.evaluate(el => getComputedStyle(el).backgroundImage)));

    const isWin = backgroundImages.every(img => img === backgroundImages[0]);

    if (isWin) {
      const isJackpot = backgroundImages[0] === 'url("assets/svg/icone/1.svg")';
      bonusInfo = {
        tipo: "Vinto",
        valore: isJackpot ? "0.50 €" : "altro"
      };
    } else {
      bonusInfo = { tipo: "Perso", valore: "0" };
    }


    console.log("Bonus Info: ", bonusInfo);
  } catch (error) {
    console.error('Errore durante l\'esecuzione del bot Snai:', error);
  } finally {
    await browser.close();
    updateSpinHistory('snai', bonusInfo);
  }

  return bonusInfo;
}

module.exports = { spinSnaiWheel };
