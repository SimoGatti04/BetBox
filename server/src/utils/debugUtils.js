const automationDebugger = {
    async checkAutomationFlags(page) {
        const flags = await page.evaluate(() => ({
            webdriver: navigator.webdriver,
            selenium: !!window.selenium,
            chrome: window.chrome,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory
        }));
        console.log('🔍 Detection Flags:', JSON.stringify(flags, null, 2));
        return flags;
    },

    setupNetworkDebug(page) {
        page.route('**/*', route => {
            const url = route.request().url();
            const method = route.request().method();

            // Only log auth/api calls with POST method
            if ((url.includes('auth') || url.includes('api')) && method === 'POST') {
                console.log('🌐 Auth Request:', {
                    endpoint: url.split('/').slice(-2).join('/'),
                    method: method
                });
            }
            route.continue();
        });
    },

    setupConsoleDebug(page) {
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('error') || text.includes('security') || text.includes('blocked')) {
                console.log('Important Browser Message:', text);
            }
        });
    }
};

module.exports = automationDebugger;

