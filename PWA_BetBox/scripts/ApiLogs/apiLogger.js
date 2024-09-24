(function() {
    const originalFetch = window.fetch;

    window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(async response => {
            const url = args[0];
            const options = args[1] || {};
            const clone = response.clone();
            let data;
            try {
                data = await clone.json();
            } catch {
                data = await clone.text();
            }

            const logs = JSON.parse(localStorage.getItem('apiLogs') || '[]');
            logs.push({
                timestamp: new Date().toISOString(),
                type: 'API Call',
                url: url,
                method: options.method || 'GET',
                requestHeaders: options.headers,
                requestBody: options.body,
                status: response.status,
                responseHeaders: Object.fromEntries(response.headers.entries()),
                responseBody: data
            });
            localStorage.setItem('apiLogs', JSON.stringify(logs));

            return response;
        });
    };
})();
