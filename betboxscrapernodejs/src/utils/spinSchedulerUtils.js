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

function logSchedule(site, type, scheduledTime) {
    const logFile = path.join(SPIN_HISTORY_DIR, `${site}ScheduleLog.json`);

    if (!fs.existsSync(SPIN_HISTORY_DIR)) {
        fs.mkdirSync(SPIN_HISTORY_DIR, { recursive: true });
    }

    let log = [];
    if (fs.existsSync(logFile)) {
        log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }

    const newEntry = {
        date: new Date().toISOString(),
        type: type,
        scheduledTime: scheduledTime.toISOString() // Salva l'orario programmato
    };

    log.push(newEntry);

    // Mantieni solo le ultime 3 programmazioni
    if (log.length > 3) {
        log = log.slice(-3);
    }

    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
}

function scheduleSpinExecution(site, spinFunction) {
    cron.schedule('0 0 * * *', () => { // Questo programma l'esecuzione alle 11:30 ogni giorno
        const randomHour = Math.floor(Math.random() * 5) + 2;
        const randomMinute = Math.floor(Math.random() * 60);

        const scheduledTime = new Date();
        scheduledTime.setHours(randomHour, randomMinute, 0, 0);

        const delay = scheduledTime.getTime() - Date.now();

        // Salva l'orario programmato
        logSchedule(site, 'spin', scheduledTime);

        setTimeout(async () => {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const lastSpinDate = await getLastSpinDate(site);

            if (lastSpinDate !== today) {
                console.log(`[${now.toISOString()}] Esecuzione spin ${site}`);
                try {
                    const result = await spinFunction();
                    updateSpinHistory(site, result);
                    saveLastSpinDate(site, today);
                } catch (error) {
                    console.error(`Errore durante l'esecuzione dello spin per ${site}:`, error);
                }
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
