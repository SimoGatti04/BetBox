const cron = require('node-cron');
const { spinGoldBetterWheel } = require('../goldBetterSpin');
const { getRandomTime, updateSpinHistory, getNextExecutionDate } = require('../../..//utils/spinSchedulerUtils');

async function performLottomaticaSpin() {
    console.log(`[${new Date().toISOString()}] Esecuzione spin Lottomatica`);
    const result = await spinGoldBetterWheel('Lottomatica');
    updateSpinHistory('lottomatica', result);
}

const cronExpression = getRandomTime();
const lottomaticaTask = cron.schedule(cronExpression, performLottomaticaSpin, {
    scheduled: true,
    timezone: "Europe/Rome"
});

lottomaticaTask.start();
console.log(`Scheduler Lottomatica avviato. Prossima esecuzione: ${getNextExecutionDate(cronExpression)}`);
