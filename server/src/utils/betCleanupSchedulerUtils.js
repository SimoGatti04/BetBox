const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const moment = require('moment-timezone');

const ACTIVE_BETS_DIR = path.join(__dirname, '..', '..', 'activeBets');

function scheduleBetCleanup() {
    cron.schedule('0 0 * * *', async () => {
        console.log('Starting daily bet cleanup');
        const sites = ['goldbet', 'lottomatica', 'sisal', 'snai'];

        for (const site of sites) {
            const siteDir = path.join(ACTIVE_BETS_DIR, site);
            const files = await fs.readdir(siteDir);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(siteDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const bet = JSON.parse(content);

                    const latestEventDate = Math.max(...bet.events.map(event => event.date));
                    const oneDayAgo = moment().tz('Europe/Rome').subtract(1, 'day').valueOf();

                    if (latestEventDate < oneDayAgo) {
                        await fs.unlink(filePath);
                        console.log(`Deleted old bet file: ${filePath}`);
                    }
                }
            }
        }

        console.log('Daily bet cleanup completed');
    }, {
        scheduled: true,
        timezone: "Europe/Rome"
    });
}

module.exports = {
    scheduleBetCleanup
};
