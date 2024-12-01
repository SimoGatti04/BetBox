const headless = true;
const record = false;

const botEngines = {
    bet365: 'playwright',
    cplay: 'playwright',
    eurobet: 'playwright',
    goldbet: 'playwright',
    lottomatica: 'playwright',
    sisal: 'playwright',
    snai: 'playwright',
}

module.exports = { headless, record, botEngines };