const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const BALANCE_HISTORY_DIR = path.join(__dirname, '..', '..', 'balanceHistory');
const LAST_BALANCE_FILE = path.join(__dirname, '..', '..', 'lastBalanceDates.json');

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
        date: new Date().toISOString(),
        balance: balance
    };

    history.push(newEntry);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    history = history.filter(entry => new Date(entry.date) >= thirtyDaysAgo);

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

function logSchedule(site, type) {
    const logFile = path.join(BALANCE_HISTORY_DIR, `${site}ScheduleLog.json`);

    if (!fs.existsSync(BALANCE_HISTORY_DIR)) {
        fs.mkdirSync(BALANCE_HISTORY_DIR, { recursive: true });
    }

    let log = [];
    if (fs.existsSync(logFile)) {
        log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }

    const newEntry = {
        date: new Date().toISOString(),
        type: type
    };

    log.push(newEntry);

    // Mantieni solo le ultime 3 programmazioni
    if (log.length > 3) {
        log = log.slice(-3);
    }

    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
}

// Funzioni di pianificazione
function scheduleBalanceFetch(site, getBalanceFunction) {
    cron.schedule('0 0 * * *', () => {
        const randomHour = Math.floor(Math.random() * 10);
        const randomMinute = Math.floor(Math.random() * 60);

        const scheduledTime = new Date();
        scheduledTime.setHours(randomHour, randomMinute, 0, 0);

        const delay = scheduledTime.getTime() - Date.now();

        setTimeout(async () => {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const lastBalanceDate = await getLastBalanceDate(site);

            if (lastBalanceDate !== today) {
                console.log(`[${now.toISOString()}] Recupero saldo ${site}`);
                try {
                    const balance = await getBalanceFunction();
                    updateBalanceHistory(site, balance);
                    saveLastBalanceDate(site, today);
                    logSchedule(site, 'balance'); // Log della programmazione
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
