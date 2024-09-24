import {fetchBalance, fetchBalanceHistory, loadBalanceHistory, loadBalances, saveBalances} from "./BalanceView.js";
import {siteImages} from "../siteImages.js";

export function showBalanceDetails(site, balance) {
    const latestBalance = loadBalances()[site] || balance;
    const detailScreen = createBalanceDetailScreen(site, latestBalance);
    detailScreen.dataset.site = site;
    document.body.appendChild(detailScreen);

    // Slide-in animation
    detailScreen.style.transform = 'translateX(100%)';
    detailScreen.offsetWidth; // Trigger reflow
    detailScreen.style.transition = 'transform 0.3s ease-out';
    detailScreen.style.transform = 'translateX(0)';
}

function createBalanceDetailScreen(site, balance) {
    const detailScreen = document.createElement('div');
    detailScreen.className = 'balance-detail-screen';

    const backgroundImage = document.createElement('div');
    backgroundImage.className = 'background-image';
    backgroundImage.style.backgroundImage = `url(${siteImages[site]})`;
    detailScreen.appendChild(backgroundImage);

    const content = document.createElement('div');
    content.className = 'detail-content';

    const header = createBalanceDetailHeader(site, detailScreen);
    const balanceContent = createBalanceDetailContent(site, balance);
    const history = createBalanceHistory(site);

    content.appendChild(header);
    content.appendChild(balanceContent);
    content.appendChild(history);

    detailScreen.appendChild(content);

    return detailScreen;
}


function createBalanceDetailHeader(site, detailScreen) {
    const header = document.createElement('div');
    header.className = 'balance-detail-header';

    const backButton = createButton('bet-detail-back-button', 'fa-arrow-left', () => closeBalanceDetails(detailScreen));
    const refreshButton = createButton('refresh-button', 'fa-sync-alt', () => updateBalanceHistoryAndDisplay(site));
    const playButton = createButton('play-button', 'fa-play', () => fetchBalance(site));

    header.appendChild(backButton);
    header.appendChild(refreshButton);
    header.appendChild(playButton);

    return header;
}


function createBalanceDetailContent(site, balance) {
    const content = document.createElement('div');
    content.className = 'balance-detail-content';
    content.innerHTML = `
        <p class="balance-amount">${balance}</p>
    `;
    return content;
}

function createBalanceHistory(site) {
    const history = document.createElement('div');
    history.className = 'balance-history';

    const historyHeader = document.createElement('div');
    historyHeader.className = 'balance-history-header';
    historyHeader.innerHTML = '<h3>Cronologia Saldo</h3>';

    history.appendChild(historyHeader);

    const historyList = document.createElement('ul');
    historyList.className = 'balance-history-list';

    const balanceHistory = getGroupedBalanceHistory(site);

    balanceHistory.forEach(entry => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="history-date">${entry.dateRange}</span>
            <span class="history-balance">${entry.balance}</span>
        `;
        historyList.appendChild(listItem);
    });

    history.appendChild(historyList);
    return history;
}

function getGroupedBalanceHistory(site) {
    const rawHistory = loadBalanceHistory()[site] || [];
    let groupedHistory = [];
    let currentGroup = null;

    rawHistory.forEach((entry, index) => {
        if (!currentGroup || currentGroup.balance !== entry.balance) {
            if (currentGroup) {
                groupedHistory.push(currentGroup);
            }
            currentGroup = {
                balance: entry.balance,
                startDate: entry.date,
                endDate: entry.date
            };
        } else {
            currentGroup.endDate = entry.date;
        }

        if (index === rawHistory.length - 1) {
            groupedHistory.push(currentGroup);
        }
    });

    return groupedHistory.map(group => ({
        dateRange: group.startDate === group.endDate ?
            formatDateShort(group.startDate) :
            `${formatDateShort(group.startDate)} - ${formatDateShort(group.endDate)}`,
        balance: group.balance
    }));
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}



function createButton(className, iconClass, onClick) {
    const button = document.createElement('button');
    button.className = className;
    button.innerHTML = `<i class="fas ${iconClass}"></i>`;
    button.addEventListener('click', onClick);
    return button;
}


export function closeBalanceDetails(detailScreen) {
    if (detailScreen && detailScreen.style) {
        detailScreen.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (detailScreen.parentNode) {
                detailScreen.parentNode.removeChild(detailScreen);
            }
        }, 300);
    }
}

function updateBalanceDisplay(detailScreen, balance) {
    const balanceAmount = detailScreen.querySelector('.balance-amount');
    if (balanceAmount) {
        balanceAmount.textContent = balance;
    }
}

async function updateBalanceHistoryAndDisplay(site) {
    const history = await fetchBalanceHistory(site);
    if (history && history.length > 0) {
        const latestBalance = history[history.length - 1].balance;
        const detailScreen = document.querySelector('.balance-detail-screen');
        if (detailScreen && detailScreen.dataset.site === site) {
            updateBalanceDisplay(detailScreen, latestBalance);
            updateBalanceHistoryDisplay(site, history);
            // Update local storage
            const balances = loadBalances();
            balances[site] = latestBalance;
            saveBalances(balances);
        }
    }
}

function updateBalanceHistoryDisplay(site, history) {
    const historyContainer = document.querySelector('.balance-history');
    if (historyContainer) {
        const historyList = historyContainer.querySelector('ul') || document.createElement('ul');
        historyList.innerHTML = '';

        const groupedHistory = getGroupedBalanceHistory(site);

        groupedHistory.forEach(entry => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span class="history-date">${entry.dateRange}</span>
                <span class="history-balance">${entry.balance}</span>
            `;
            historyList.appendChild(listItem);
        });

        historyContainer.appendChild(historyList);
    }
}




window.addEventListener('balanceUpdated', (event) => {
    const { site, balance } = event.detail;
    const detailScreen = document.querySelector('.balance-detail-screen');
    if (detailScreen && detailScreen.dataset.site === site) {
        updateBalanceDisplay(detailScreen, balance);
    }
});




