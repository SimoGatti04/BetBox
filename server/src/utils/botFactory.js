const path = require('path');
const { plugins } = require('../../config');

function getBot(site, operation) {
    const plugin = plugins[site]?.[operation] || 'playwright';
    const basePath = path.join(__dirname, '..', 'bots', operation);
    const botPath = plugin === 'puppeteer'
        ? path.join(basePath, 'puppeteer', `${site}Bot.js`)
        : path.join(basePath, `${site}Bot.js`);

    return botPath;
}

module.exports = { getBot };
