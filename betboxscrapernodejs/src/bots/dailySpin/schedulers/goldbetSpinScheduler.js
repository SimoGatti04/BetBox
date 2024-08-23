const cron = require('node-cron');
const { spinGoldBetterWheel } = require('../goldBetterSpin');
const { updateSpinHistory, getLastSpinDate, saveLastSpinDate } = require('../../../utils/spinSchedulerUtils');

const cronExpression = '0 * 2-5 * * *';

async function performGoldbetSpin() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastSpinDate = await getLastSpinDate('goldbet');

    if (lastSpinDate !== today && now.getHours() >= 2 && now.getHours() <= 5) {
        if (now.getMinutes() === Math.floor(Math.random() * 60)) {
            console.log(`[${now.toISOString()}] Esecuzione spin Goldbet`);
            const result = await spinGoldBetterWheel('Goldbet');
            updateSpinHistory('goldbet', result);
            saveLastSpinDate('goldbet', today);
        }
    }
}

const goldbetTask = cron.schedule(cronExpression, performGoldbetSpin, {
    scheduled: true,
    timezone: "Europe/Rome"
});

goldbetTask.start();
