const cron = require('node-cron');
const { spinGoldBetterWheel } = require('../goldBetterSpin');
const { updateSpinHistory, getLastSpinDate, saveLastSpinDate } = require('../../../utils/spinSchedulerUtils');

const cronExpression = '0 * 2-5 * * *';

async function performLottomaticaSpin() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastSpinDate = await getLastSpinDate('lottomatica');

    if (lastSpinDate !== today && now.getHours() >= 2 && now.getHours() <= 5) {
        if (now.getMinutes() === Math.floor(Math.random() * 60)) {
            console.log(`[${now.toISOString()}] Esecuzione spin Lottomatica`);
            const result = await spinGoldBetterWheel('Lottomatica');
            updateSpinHistory('lottomatica', result);
            saveLastSpinDate('lottomatica', today);
        }
    }
}

const lottomaticaTask = cron.schedule(cronExpression, performLottomaticaSpin, {
    scheduled: true,
    timezone: "Europe/Rome"
});

lottomaticaTask.start();
