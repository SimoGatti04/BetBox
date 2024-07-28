const fs = require('fs');
const path = require('path');

const sessionsDir = path.join(__dirname, '..', '..', 'sessions');

if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

async function saveSessionData(page, fileName) {
  const sessionData = await page.evaluate(() => {
    return {
      localStorage: JSON.stringify(window.localStorage),
      sessionStorage: JSON.stringify(window.sessionStorage)
    };
  });
  const filePath = path.join(sessionsDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
}

async function loadSessionData(page, fileName) {
  const filePath = path.join(sessionsDir, fileName);
  if (fs.existsSync(filePath)) {
    const sessionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    await page.evaluate(data => {
      Object.keys(JSON.parse(data.localStorage)).forEach(key => {
        window.localStorage.setItem(key, JSON.parse(data.localStorage)[key]);
      });
      Object.keys(JSON.parse(data.sessionStorage)).forEach(key => {
        window.sessionStorage.setItem(key, JSON.parse(data.sessionStorage)[key]);
      });
    }, sessionData);
  }
}

module.exports = { saveSessionData, loadSessionData };
