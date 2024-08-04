const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const path = require('path');
const fs = require('fs');

chromium.use(stealth);

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
];

function getSessionFile(botName) {
  return path.join(__dirname, '..', '..', 'sessions', `${botName}_session.json`);
}

async function delay(min, max) {
  const time = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise(resolve => setTimeout(resolve, time));
}

async function simulateHumanBehavior(page) {
  const { width, height } = await page.viewportSize();
  await smoothMouseMove(page, Math.random() * width, Math.random() * height);
}

async function smoothMouseMove(page, x, y) {
  const steps = 10;
  const currentPosition = await page.evaluate(() => ({ x: window.mouseX || 0, y: window.mouseY || 0 }));
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      currentPosition.x + (x - currentPosition.x) * (i / steps),
      currentPosition.y + (y - currentPosition.y) * (i / steps)
    );
    await delay(10, 20);
  }
}

async function simulateTyping(page, selector, text) {
  await page.focus(selector);
  await page.keyboard.type(text, { delay: Math.floor(Math.random() * 100) + 50 });
}

async function setupBrowser(botName) {
  const browser = await chromium.launch({ headless: false });
  const sessionFile = getSessionFile(botName);
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  let context;
  if (fs.existsSync(sessionFile)) {
    context = await browser.newContext({
      storageState: sessionFile,
      userAgent: userAgent
    });
  } else {
    context = await browser.newContext({ userAgent: userAgent });
  }

  const page = await context.newPage();
  return { browser, context, page };
}

module.exports = {
  delay,
  simulateHumanBehavior,
  smoothMouseMove,
  simulateTyping,
  setupBrowser,
  getSessionFile
};
