const fs = require('fs');
const path = require('path');

const SPIN_HISTORY_DIR = path.join(__dirname, '..', '..', 'spinHistory');

function getRandomTime() {
    const hour = Math.floor(Math.random() * 4) + 2; // 2-5
    const minute = Math.floor(Math.random() * 60); // 0-59
    const second = Math.floor(Math.random() * 60); // 0-59
    return `${second} ${minute} ${hour} * * *`;
}

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
    history = history.filter(entry => new Date(entry.date) >= new Date(Date.now() - 5 * 24 * 60 * 60 * 1000));

    fs.writeFileSync(spinHistoryFile, JSON.stringify(history, null, 2));
}

function getNextExecutionDate(cronExpression) {
    const [minute, hour] = cronExpression.split(' ');
    const now = new Date();
    const nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hour), parseInt(minute));

    if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
    }

    return nextDate;
}

module.exports = {
    getRandomTime,
    updateSpinHistory,
    getNextExecutionDate
};
