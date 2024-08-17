const cron = require('node-cron');
const { spinSnaiWheel } = require('../snaiDailySpin');
const { getRandomTime, updateSpinHistory, getNextExecutionDate } = require('../../..//utils/spinSchedulerUtils');

const cronExpression = '0 * 2-5 * * *';

async function performSnaiSpin() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (hour >= 2 && hour <= 5) {
        if (minute === Math.floor(Math.random() * 60)) {
            console.log(`[${now.toISOString()}] Esecuzione spin Snai`);
            const result = await spinSnaiWheel();
            updateSpinHistory('snai', result);
        }
    }
}

const snaiTask = cron.schedule(cronExpression, performSnaiSpin, {
    scheduled: true,
    timezone: "Europe/Rome"
});


snaiTask.start();
console.log(`Scheduler Snai avviato. Prossima esecuzione: ${getNextExecutionDate(cronExpression)}`);
