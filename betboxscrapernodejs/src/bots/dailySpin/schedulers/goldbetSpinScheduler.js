const cron = require('node-cron');
const { spinGoldBetterWheel } = require('../goldBetterSpin');
const { getRandomTime, updateSpinHistory, getNextExecutionDate } = require('../../..//utils/spinSchedulerUtils');

const cronExpression = '0 * 2-5 * * *';

async function performGoldbetSpin() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (hour >= 2 && hour <= 5) {
        if (minute === Math.floor(Math.random() * 60)) {
            console.log(`[${now.toISOString()}] Esecuzione spin Goldbet`);
            const result = await spinGoldBetterWheel('Goldbet');
            updateSpinHistory('goldbet', result);
        }
    }
}

const goldbetTask = cron.schedule(cronExpression, performGoldbetSpin, {
    scheduled: true,
    timezone: "Europe/Rome"
});


goldbetTask.start();
console.log(`Scheduler Goldbet avviato. Prossima esecuzione: ${getNextExecutionDate(cronExpression)}`);
