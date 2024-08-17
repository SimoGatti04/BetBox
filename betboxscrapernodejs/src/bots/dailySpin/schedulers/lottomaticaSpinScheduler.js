const cron = require('node-cron');
const { spinGoldBetterWheel } = require('../goldBetterSpin');
const { getRandomTime, updateSpinHistory, getNextExecutionDate } = require('../../..//utils/spinSchedulerUtils');

const cronExpression = '0 * 2-5 * * *';

async function performLottomaticaSpin() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (hour >= 2 && hour <= 5) {
        if (minute === Math.floor(Math.random() * 60)) {
            console.log(`[${now.toISOString()}] Esecuzione spin Lottomatica`);
            const result = await spinGoldBetterWheel('Lottomatica');
            updateSpinHistory('lottomatica', result);
        }
    }
}

const lottomaticaTask = cron.schedule(cronExpression, performLottomaticaSpin, {
    scheduled: true,
    timezone: "Europe/Rome"
});


lottomaticaTask.start();
console.log(`Scheduler Lottomatica avviato. Prossima esecuzione: ${getNextExecutionDate(cronExpression)}`);
