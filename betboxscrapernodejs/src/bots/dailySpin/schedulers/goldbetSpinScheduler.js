const cron = require('node-cron');
const { spinGoldBetterWheel } = require('../goldBetterSpin');
const { getRandomTime, updateSpinHistory, getNextExecutionDate } = require('../../..//utils/spinSchedulerUtils');

async function performGoldbetSpin() {
    console.log(`[${new Date().toISOString()}] Esecuzione spin Goldbet`);
    const result = await spinGoldBetterWheel('Goldbet');
    updateSpinHistory('goldbet', result);
}

const cronExpression = getRandomTime();
const goldbetTask = cron.schedule(cronExpression, performGoldbetSpin, {
    scheduled: true,
    timezone: "Europe/Rome"
});

goldbetTask.start();
console.log(`Scheduler Goldbet avviato. Prossima esecuzione: ${getNextExecutionDate(cronExpression)}`);
