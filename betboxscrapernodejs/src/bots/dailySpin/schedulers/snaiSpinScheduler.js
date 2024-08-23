const cron = require('node-cron');
const { spinSnaiWheel } = require('../snaiDailySpin');
const { updateSpinHistory, getLastSpinDate, saveLastSpinDate } = require('../../../utils/spinSchedulerUtils');

const cronExpression = '0 * 2-5 * * *';

async function performSnaiSpin() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastSpinDate = await getLastSpinDate('snai');

    if (lastSpinDate !== today && now.getHours() >= 2 && now.getHours() <= 5) {
        if (now.getMinutes() === Math.floor(Math.random() * 60)) {
            console.log(`[${now.toISOString()}] Esecuzione spin Snai`);
            const result = await spinSnaiWheel();
            updateSpinHistory('snai', result);
            saveLastSpinDate('snai', today);
        }
    }
}

const snaiTask = cron.schedule(cronExpression, performSnaiSpin, {
    scheduled: true,
    timezone: "Europe/Rome"
});

snaiTask.start();
