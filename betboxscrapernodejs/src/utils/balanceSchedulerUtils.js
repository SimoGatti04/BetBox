const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const BALANCE_HISTORY_DIR = path.join(__dirname, '..', '..', 'balanceHistory');
const LAST_BALANCE_FILE = path.join(__dirname, '..', '..', 'balanceHistory', 'lastBalanceDates.json');

// Funzioni di utilità
function updateBalanceHistory(site, balance) {
    const balanceHistoryFile = path.join(BALANCE_HISTORY_DIR, `${site}BalanceHistory.json`);

    if (!fs.existsSync(BALANCE_HISTORY_DIR)){
        fs.mkdirSync(BALANCE_HISTORY_DIR, { recursive: true });
    }

    let history = [];
    if (fs.existsSync(balanceHistoryFile)) {
        history = JSON.parse(fs.readFileSync(balanceHistoryFile, 'utf8'));
    }

    const newEntry = {
        date: moment().tz('Europe/Rome').toISOString(),
        balance: balance
    };

    history.push(newEntry);

    const thirtyDaysAgo = moment().tz('Europe/Rome').subtract(30, 'days');
    history = history.filter(entry => moment(entry.date).isAfter(thirtyDaysAgo));

    fs.writeFileSync(balanceHistoryFile, JSON.stringify(history, null, 2));
}

function getLastBalanceDate(site) {
    if (fs.existsSync(LAST_BALANCE_FILE)) {
        const lastBalanceDates = JSON.parse(fs.readFileSync(LAST_BALANCE_FILE, 'utf8'));
        return lastBalanceDates[site] || null;
    }
    return null;
}

function saveLastBalanceDate(site, date) {
    let lastBalanceDates = {};
    if (fs.existsSync(LAST_BALANCE_FILE)) {
        lastBalanceDates = JSON.parse(fs.readFileSync(LAST_BALANCE_FILE, 'utf8'));
    }
    lastBalanceDates[site] = date;
    fs.writeFileSync(LAST_BALANCE_FILE, JSON.stringify(lastBalanceDates, null, 2));
}

function logSchedule(site, type, scheduledTime) {
    const logFile = path.join(BALANCE_HISTORY_DIR, `${site}ScheduleLog.json`);

    if (!fs.existsSync(BALANCE_HISTORY_DIR)) {
        fs.mkdirSync(BALANCE_HISTORY_DIR, { recursive: true });
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

// Funzioni di pianificazione
function scheduleBalanceFetch(site, getBalanceFunction) {
    cron.schedule('30 0 * * *', () => {
        console.log(`Cron job triggered for site: ${site}`);
        const randomHour = Math.floor(Math.random() * 2) + 1; // 1-2 ore
        const randomMinute = Math.floor(Math.random() * 60); // 0-59 minuti

        const scheduledTime = moment().tz('Europe/Rome').set({ hour: randomHour, minute: randomMinute, second: 0, millisecond: 0 });

        const now = moment().tz('Europe/Rome');
        const delay = scheduledTime.valueOf() - now.valueOf();

        console.log(`Scheduled time for ${site}: ${scheduledTime.tz('Europe/Rome').format()}`);
        console.log(`Current time: ${now.format()}`);
        console.log(`Delay: ${delay} ms`);

        // Salva l'orario programmato
        logSchedule(site, 'balance', scheduledTime);

        setTimeout(async () => {
            const now = moment().tz('Europe/Rome');
            const today = now.format('YYYY-MM-DD');
            const lastBalanceDate = await getLastBalanceDate(site);

            if (lastBalanceDate !== today) {
                console.log(`[${now.format()}] Recupero saldo ${site}`);
                try {
                    const balance = await getBalanceFunction();
                    updateBalanceHistory(site, balance);
                    saveLastBalanceDate(site, today);
                } catch (error) {
                    console.error(`Errore durante il recupero del saldo per ${site}:`, error);
                }
            }
        }, delay);
    }, {
        scheduled: true,
        timezone: "Europe/Rome"
    });
}

function initializeAllBalanceSchedulers() {
    const { getGoldBetterBalance } = require('../bots/balances/goldBetterBot');
    const { getBet365Balance } = require('../bots/balances/bet365Bot');
    const { getEurobetBalance } = require('../bots/balances/eurobetBot');
    const { getSnaiBalance } = require('../bots/balances/snaiBot');
    const { getSisalBalance } = require('../bots/balances/sisalBot');
    const { getCplayBalance } = require('../bots/balances/cplayBot');

    console.log('Initializing all balance schedulers');
    scheduleBalanceFetch('goldbet', () => getGoldBetterBalance('Goldbet'));
    scheduleBalanceFetch('lottomatica', () => getGoldBetterBalance('Lottomatica'));
    scheduleBalanceFetch('bet365', getBet365Balance);
    scheduleBalanceFetch('eurobet', getEurobetBalance);
    scheduleBalanceFetch('snai', getSnaiBalance);
    scheduleBalanceFetch('sisal', getSisalBalance);
    scheduleBalanceFetch('cplay', getCplayBalance);
}

module.exports = {
    initializeAllBalanceSchedulers,
    updateBalanceHistory,
};