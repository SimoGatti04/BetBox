export function createLogView() {
    checkAndCleanLogs();
    const view = document.createElement('div');
    view.className = 'log-container';

    const logList = document.createElement('div');
    logList.className = 'log-list';
    view.appendChild(logList);

    renderLogs(logList);

    return view;
}


function renderLogs(logList) {
    checkAndCleanLogs();
    const logs = JSON.parse(localStorage.getItem('apiLogs') || '[]');
    logList.innerHTML = logs.map((log, index) => createLogPreview(log, index)).join('');

    logList.addEventListener('click', (e) => {
        if (e.target.closest('.log-preview')) {
            const index = e.target.closest('.log-preview').dataset.index;
            showLogDetails(logs[index]);
        }
    });
}

function createLogPreview(log, index) {
    const timestamp = new Date(log.timestamp);
    const formattedTime = timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const endpoint = log.url.split('/').pop();

    return `
        <div class="log-preview" data-index="${index}">
            <div class="log-info">
                <p class="log-time">${formattedTime}</p>
                <p class="log-method">${log.method}</p>
                <p class="log-status">${log.status}</p>
                <p class="log-endpoint">${endpoint}</p>
            </div>
        </div>
    `;
}

function showLogDetails(log) {
    const detailView = document.createElement('div');
    detailView.className = 'log-detail-view';
    detailView.innerHTML = createLogDetailContent(log);

    document.body.appendChild(detailView);

    const closeButton = detailView.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(detailView);
    });
}

function createLogDetailContent(log) {
    return `
        <div class="log-detail-header">
            <h2>Dettagli Log</h2>
            <button class="close-button">×</button>
        </div>
        <div class="log-detail-content">
            <p><strong>Tipo:</strong> ${log.type}</p>
            <p><strong>Metodo:</strong> ${log.method}</p>
            <p><strong>URL:</strong> ${log.url}</p>
            <p><strong>Status:</strong> ${log.status}</p>
            <p><strong>Timestamp:</strong> ${new Date(log.timestamp).toLocaleString('it-IT')}</p>
            <h3>Request Headers:</h3>
            <pre>${JSON.stringify(log.requestHeaders, null, 2)}</pre>
            <h3>Request Body:</h3>
            <pre>${JSON.stringify(log.requestBody, null, 2)}</pre>
            <h3>Response Headers:</h3>
            <pre>${JSON.stringify(log.responseHeaders, null, 2)}</pre>
            <h3>Response Body:</h3>
            <pre>${JSON.stringify(log.responseBody, null, 2)}</pre>
        </div>
    `;
}

function cleanOldLogs() {
    const logs = JSON.parse(localStorage.getItem('apiLogs') || '[]');
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    const newLogs = logs.filter(log => new Date(log.timestamp).getTime() > sixHoursAgo);
    localStorage.setItem('apiLogs', JSON.stringify(newLogs));
    localStorage.setItem('lastLogCleanTime', Date.now().toString());
}

function checkAndCleanLogs() {
    const lastCleanTime = parseInt(localStorage.getItem('lastLogCleanTime') || '0');
    if (Date.now() - lastCleanTime > 6 * 60 * 60 * 1000) {
        cleanOldLogs();
    }
}
