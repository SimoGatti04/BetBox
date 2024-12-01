const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const SPIN_HISTORY_DIR = path.join(__dirname, '..', '..', 'spinHistory');
const LAST_SPIN_FILE = path.join(__dirname, '..', '..', 'spinHistory', 'lastSpinDates.json');

function updateSpinHistory(site, result) {
    const spinHistoryFile = path.join(SPIN_HISTORY_DIR, `${site.toLowerCase()}SpinHistory.json`);

    if (!fs.existsSync(SPIN_HISTORY_DIR)){
        fs.mkdirSync(SPIN_HISTORY_DIR, { recursive: true });
    }

    let history = [];
    if (fs.existsSync(spinHistoryFile)) {
        history = JSON.parse(fs.readFileSync(spinHistoryFile, 'utf8'));
    }

    const newEntry = {
        date: moment().tz('Europe/Rome').toISOString(),
        result: result
    };

    history.push(newEntry);

    const fiveDaysAgo = moment().tz('Europe/Rome').subtract(5, 'days');
    history = history.filter(entry => moment(entry.date).isAfter(fiveDaysAgo));

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
        date: moment().tz('Europe/Rome').toISOString(),
        type: type,
        scheduledTime: scheduledTime.tz('Europe/Rome').toISOString() // Salva l'orario programmato
    };

    log.push(newEntry);

    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
}

function scheduleSpinExecution(site, spinFunction) {
    cron.schedule('0 0 * * *', () => { // Questo programma l'esecuzione alle 00:34 ogni giorno
        console.log(`Cron job triggered for site: ${site}`);
        const randomHour = Math.floor(Math.random() * 5) + 2;
        const randomMinute = Math.floor(Math.random() * 60);

        const scheduledTime = moment().tz('Europe/Rome').set({ hour: randomHour, minute: randomMinute, second: 0, millisecond: 0 });

        const now = moment().tz('Europe/Rome');
        const delay = scheduledTime.valueOf() - now.valueOf();

        console.log(`Scheduled time for ${site}: ${scheduledTime.tz('Europe/Rome').format()}`);
        console.log(`Current time: ${now.format()}`);
        console.log(`Delay: ${delay} ms`);

        // Salva l'orario programmato
        logSchedule(site, 'spin', scheduledTime);

        setTimeout(async () => {
            const now = moment().tz('Europe/Rome');
            const today = now.format('YYYY-MM-DD');
            const lastSpinDate = await getLastSpinDate(site);

            if (lastSpinDate !== today) {
                console.log(`[${now.format()}] Esecuzione spin ${site}`);
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

    console.log('Initializing all spin schedulers');
    scheduleSpinExecution('goldbet', () => spinGoldBetterWheel('Goldbet'));
    scheduleSpinExecution('lottomatica', () => spinGoldBetterWheel('Lottomatica'));
    //scheduleSpinExecution('snai', spinSnaiWheel);
}


module.exports = {
    initializeAllSpinSchedulers,
    updateSpinHistory,
};
