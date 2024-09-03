const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const SPIN_HISTORY_DIR = path.join(__dirname, '..', '..', 'spinHistory');
const LAST_SPIN_FILE = path.join(__dirname, '..', '..', 'lastSpinDates.json');

function updateSpinHistory(site, result) {
    const spinHistoryFile = path.join(SPIN_HISTORY_DIR, `${site}SpinHistory.json`);

    if (!fs.existsSync(SPIN_HISTORY_DIR)){
        fs.mkdirSync(SPIN_HISTORY_DIR, { recursive: true });
    }

    let history = [];
    if (fs.existsSync(spinHistoryFile)) {
        history = JSON.parse(fs.readFileSync(spinHistoryFile, 'utf8'));
    }

    const newEntry = {
        date: new Date().toISOString(),
        result: result
    };

    history.push(newEntry);

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    history = history.filter(entry => new Date(entry.date) >= fiveDaysAgo);

    fs.writeFileSync(spinHistoryFile, JSON.stringify(history, null, 2));
}


function getLastSpinDate(site) {
    if (fs.existsSync(LAST_SPIN_FILE)) {
        const lastSpinDates = JSON.parse(fs.readFileSync(LAST_SPIN_FILE, 'utf8'));
        return lastSpinDates[site] || null;
    }
    return null;
}

function saveLastSpinDate(site, date) {
    let lastSpinDates = {};
    if (fs.existsSync(LAST_SPIN_FILE)) {
        lastSpinDates = JSON.parse(fs.readFileSync(LAST_SPIN_FILE, 'utf8'));
    }
    lastSpinDates[site] = date;
    fs.writeFileSync(LAST_SPIN_FILE, JSON.stringify(lastSpinDates, null, 2));
}

function scheduleSpinExecution(site, spinFunction) {
    cron.schedule('0 0 * * *', () => {
        const randomHour = Math.floor(Math.random() * 10);
        const randomMinute = Math.floor(Math.random() * 60);

        const scheduledTime = new Date();
        scheduledTime.setHours(randomHour, randomMinute, 0, 0);

        const delay = scheduledTime.getTime() - Date.now();

        setTimeout(async () => {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const lastSpinDate = await getLastSpinDate(site);

            if (lastSpinDate !== today) {
                console.log(`[${now.toISOString()}] Esecuzione spin ${site}`);
                const result = await spinFunction();
                updateSpinHistory(site, result);
                saveLastSpinDate(site, today);
            }
        }, delay);
    }, {
        scheduled: true,
        timezone: "Europe/Rome"
    });
}

function initializeAllSpinSchedulers() {
    const { spinGoldBetterWheel } = require('../bots/dailySpin/goldBetterSpin');
    const { spinSnaiWheel } = require('../bots/dailySpin/snaiDailySpin');

    scheduleSpinExecution('goldbet', () => spinGoldBetterWheel('Goldbet'));
    scheduleSpinExecution('lottomatica', () => spinGoldBetterWheel('Lottomatica'));
    scheduleSpinExecution('snai', spinSnaiWheel);
}

module.exports = {
    initializeAllSpinSchedulers,
};