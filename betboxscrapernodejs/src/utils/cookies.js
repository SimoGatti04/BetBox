const fs = require('fs');
const path = require('path');

const cookiesDir = path.join(__dirname, '..', '..', 'cookies');

if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir, { recursive: true });
}

async function saveCookies(page, fileName) {
  const cookies = await page.cookies();
  const filePath = path.join(cookiesDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
}

async function loadCookies(page, fileName) {
  const filePath = path.join(cookiesDir, fileName);
  if (fs.existsSync(filePath)) {
    const cookies = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    await page.setCookie(...cookies);
  }
}

module.exports = { saveCookies, loadCookies };
