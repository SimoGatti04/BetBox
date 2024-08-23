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

module.exports = {
    updateSpinHistory,
    getLastSpinDate,
    saveLastSpinDate
};
