const { connect } = require('puppeteer-real-browser');
const path = require('path');
const { headless } = require('../../config.js');

async function setupBrowser(botName) {
    console.log(`Inizializzazione del browser per ${botName}`);
    const { browser, page } = await connect({
        turnstile: true,
        headless: headless,
        customConfig: {},
        connectOption: {
            defaultViewport: {
                width: 1240,
                height: 1080
            }
        }
    });

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'it-IT,it;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.it/',
        'DNT': '1'
    });

    return { browser, page };
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

module.exports = {
    delay,
    simulateHumanBehavior,
    smoothMouseMove,
    simulateTyping,
    smoothMouseMoveToElement,
    setupBrowser,
    getSessionFile,
    waitForVerificationCode
};
