const cron = require('node-cron');
const { spinSnaiWheel } = require('../snaiDailySpin');
const { getRandomTime, updateSpinHistory, getNextExecutionDate } = require('../../..//utils/spinSchedulerUtils');

async function performSnaiSpin() {
    console.log(`[${new Date().toISOString()}] Esecuzione spin Snai`);
    const result = await spinSnaiWheel();
    updateSpinHistory('snai', result);
}

const cronExpression = getRandomTime();
const snaiTask = cron.schedule(cronExpression, performSnaiSpin, {
    scheduled: true,
    timezone: "Europe/Rome"
});

snaiTask.start();
console.log(`Scheduler Snai avviato. Prossima esecuzione: ${getNextExecutionDate(cronExpression)}`);
