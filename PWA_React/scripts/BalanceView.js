import { siteImages } from './siteImages.js';

export function createBalanceView() {
    const view = document.createElement('div');
    view.className = 'balances-container';

    const sites = ['goldbet', 'bet365', 'eurobet', 'sisal', 'snai', 'lottomatica', 'cplay'];
    sites.forEach(site => {
        const card = createBalanceCard(site);
        view.appendChild(card);
    });

    return view;
}

function createBalanceCard(site) {
    const card = document.createElement('div');
    card.className = 'card';

    const icon = document.createElement('img');
    icon.src = siteImages[site];
    icon.className = 'icon';
    card.appendChild(icon);

    const balance = document.createElement('p');
    balance.className = 'balance-text';
    balance.textContent = 'N/A';
    card.appendChild(balance);

    const refreshButton = document.createElement('button');
    refreshButton.className = 'refresh-button';
    refreshButton.textContent = '↻'; // Ensure this is the correct character for the arrow
    refreshButton.addEventListener('click', () => fetchBalance(site));
    card.appendChild(refreshButton);

    return card;
}


function fetchBalance(site) {
    return new Promise((resolve, reject) => {
        const urlString = `https://legally-modest-joey.ngrok-free.app/balances/${site}`;
        fetch(urlString)
            .then(response => response.json())
            .then(data => {
                updateBalance(site, data.balance);
                resolve(data.balance);
            })
            .catch(error => {
                console.error('Error fetching balance:', error);
                reject(error);
            });
    });
}

function updateBalance(site, balance) {
    const balanceBox = document.querySelector(`.card[data-site="${site}"]`);
    if (balanceBox) {
        const balanceText = balanceBox.querySelector('.balance-text');
        balanceText.textContent = balance;
    }
}
