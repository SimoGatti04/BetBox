const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile } = require('../../utils/botUtils');
const { setupGoldBetterBrowser, goldBetterLogin, acceptGoldBetterCookies, extractBonusValue, extractBonusType } = require('../../utils/goldBetterUtils');

async function spinGoldBetterWheel(site){
  console.log(`Inizio del processo di daily spin su ${site}`);

  const {browser, context, page} = await setupBrowser(site.toLowerCase());
  let bonusInfo = null;
  await setupGoldBetterBrowser(page, site);
  try {
    await goldBetterLogin(page, site);
    await acceptGoldBetterCookies(page);

    await delay(3000, 4000);

    console.log("Vado al sito dello spin");
    await page.goto(`https://www.${site.toLowerCase()}.it/casino/table-games/giochi/ruota-dei-bonus`);

    console.log("Aspetto il pulsante per l'apparizione della finestra di conferma");
    await page.waitForSelector('button.game__detail__desktop--button--play[title="Gioca a Ruota dei Bonus"]');

    console.log("Premo il pulsante per l'apparizione della finestra di conferma");
    await page.click('button.game__detail__desktop--button--play[title="Gioca a Ruota dei Bonus"]');

    console.log("Aspetto il pulsante per giocare");
    await page.waitForSelector('button[type="submit"][title="Gioca"]');

    console.log("Premo il pulsante per giocare");
    await page.click('button[type="submit"][title="Gioca"]');

    console.log("Navigo verso la finestra nuova");
    const newPage = await context.waitForEvent('page');
    await newPage.waitForLoadState();
    if (await newPage.title() === 'Ruota dei Bonus') {
      console.log('Finestra trovata');
      try {
        console.log("Cerco il pulsante per effettuare lo spin");
        await newPage.waitForSelector('#spin_button', {state: 'visible', timeout: 15000});

        console.log("Clicco sul pulsante per effettuare il spin");
        await newPage.click('#spin_button');

        bonusInfo = {
          tipo: await extractBonusType(newPage),
          valore: await extractBonusValue(newPage)
        };
      } catch (error) {
        console.log('Spin non trovato: ', error);
        bonusInfo = { tipo: "-", valore : "-" };
        try {
          console.log("Clicco sul pulsante per chiudere la finestra");
          await newPage.click('a:has-text("CHIUDI")');
          console.log("Cliccato");
        } catch (error){
          console.log('Chiudi non trovato: ', error);
        }
        throw error;
      }
    }
  } catch (error) {
    console.error(`Errore durante l'esecuzione del bot su ${site}: `, error);
    await browser.close();
  }
  return bonusInfo;
}

module.exports = { spinGoldBetterWheel };
