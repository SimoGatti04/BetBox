const { connect } = require('puppeteer-real-browser');
const path = require('path');
const { headless, record } = require('../../../config.js');
const fs = require('fs');

async function setupBrowser(botName) {
    console.log(`Inizializzazione del browser per ${botName}`);
    const { browser, page } = await connect({
        turnstile: true,
        headless: headless,
        fingerprint: false,
        customConfig: {
            puppeteerOptions: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--disable-gpu',
                    '--window-position=0,0',
                    '--ignore-certifcate-errors',
                    '--ignore-certifcate-errors-spki-list',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-blink-features=AutomationControlled',
                    '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ]
            }
        },
        connectOption: {
            defaultViewport: {
                width: 1240,
                height: 1080
            }
        }
    });

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    try {
        const sessionFile = getSessionFile(botName);
        if (fs.existsSync(sessionFile)) {
            const sessionData = JSON.parse(fs.readFileSync(sessionFile).toString());
            if(!botName.toLowerCase().includes("goldbet") && !botName.toLowerCase().includes("lottomatica")){
                await page.setCookie(...sessionData.cookies);
            }
            page.on('load', async () => {
                if (sessionData.localStorage) {
                    await page.evaluate((storageData) => {
                        for (const [key, value] of Object.entries(storageData)) {
                            window.localStorage.setItem(key, value);
                        }
                    }, sessionData.localStorage);
                }
            });
            console.log(`Session loaded for ${botName}`);
        }
    } catch (error) {
        console.log(`No previous session found for ${botName}`);
    }

    let screenshotInterval;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (record) {
        const screenshotsDir = path.resolve(__dirname, '..', '..', 'recordings', 'screenshots', botName, timestamp);
        fs.mkdirSync(screenshotsDir, {recursive: true});

        // Take screenshot every 500ms
         screenshotInterval = setInterval(async () => {
            try {
                await page.screenshot({
                    path: path.join(screenshotsDir, `${Date.now()}.png`),
                    fullPage: true
                });
            } catch (error) {
                console.log('Screenshot error:', error);
            }
        }, 500);
    }

    return { browser, page, screenshotInterval };
}

function delay(min, max) {
    return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
}

async function simulateHumanBehavior(page) {
    const viewportSize = await page.viewport();
    await smoothMouseMove(page, Math.random() * viewportSize.width, Math.random() * viewportSize.height);
}

async function smoothMouseMove(page, x, y) {
    const steps = 10;
    const currentPosition = await page.evaluate(() => ({ x: window.mouseX || 0, y: window.mouseY || 0 }));

    await page.evaluate(() => {
        if (!document.getElementById('fake-cursor')) {
            const cursor = document.createElement('div');
            cursor.id = 'fake-cursor';
            cursor.style.position = 'fixed';
            cursor.style.width = '10px';
            cursor.style.height = '10px';
            cursor.style.borderRadius = '50%';
            cursor.style.backgroundColor = 'red';
            cursor.style.pointerEvents = 'none';
            cursor.style.zIndex = '9999';
            document.body.appendChild(cursor);
        }
    });

    for (let i = 1; i <= steps; i++) {
        const newX = currentPosition.x + (x - currentPosition.x) * (i / steps);
        const newY = currentPosition.y + (y - currentPosition.y) * (i / steps);

        await page.evaluate((newX, newY) => {
            document.getElementById('fake-cursor').style.left = `${newX}px`;
            document.getElementById('fake-cursor').style.top = `${newY}px`;
        }, newX, newY);

        await page.mouse.move(newX, newY);
        await delay(10, 20);
    }

    await page.evaluate(() => document.body.removeChild(document.getElementById('fake-cursor')));
}

async function simulateTyping(page, selector, text) {
    await page.click(selector);
    await delay(100, 200);

    for (const char of text) {
        await page.keyboard.press(char);
        await delay(50, 150);
    }

    // Verify the input value matches the text
    const inputValue = await page.evaluate((sel) => document.querySelector(sel).value, selector);
    if (inputValue !== text) {
        await page.evaluate((sel, txt) => document.querySelector(sel).value = txt, selector, text);
    }
}


async function smoothMouseMoveToElement(page, frame, element) {
    const box = await frame.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }, element);

    if (!box) {
        console.log('Element not visible or has no dimensions');
        return;
    }

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await page.mouse.move(x, y, { steps: 10 });
}


function getSessionFile(botName) {
    return path.join(__dirname, '..', '..', 'sessions', `${botName}_session.json`);
}

async function waitForVerificationCode(){
    return new Promise((resolve) => {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        })

        const connectedClients = Array.from(global.wss.clients).filter(client => client.readyState === WebSocket.OPEN);
        console.log(`Client connessi: ${connectedClients.length}`);
        global.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'VERIFICATION_REQUIRED'
                }));
            }
        });

        readline.question('Inserisci il codice di verifica: ', (code) => {
            readline.close();
            resolve(code);
        });

        global.wss.once('verification-code', (code) => {
            readline.close();
            resolve(code);
        });
    });
}

function caseInsensitiveXPath(path, text) {
    return `xpath=//${path}[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "${text.toLowerCase()}")]`;
}

async function saveSession(page, siteName) {
    const cookies = await page.cookies();
    const localStorage = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            data[key] = window.localStorage.getItem(key);
        }
        return data;
    });

    const sessionData = { cookies, localStorage };
    fs.writeFileSync(getSessionFile(siteName), JSON.stringify(sessionData, null, 2));
    console.log(`Session saved for ${siteName}`);
}



module.exports = {
    delay,
    simulateHumanBehavior,
    smoothMouseMove,
    simulateTyping,
    smoothMouseMoveToElement,
    setupBrowser,
    getSessionFile,
    waitForVerificationCode,
    caseInsensitiveXPath,
    saveSession
};
