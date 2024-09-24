import { siteImages } from '../siteImages.js';
import { getRomeTime } from '../utils.js';
import config from "../../config.js";
import {showBalanceDetails} from "./BalanceDetailView.js";

const fetchingStatus = {};
let isFetching = false;

export function saveBalances(balances) {
    localStorage.setItem('balances', JSON.stringify(balances));
}

export function loadBalances() {
    const balances = localStorage.getItem('balances');
    return balances ? JSON.parse(balances) : {};
}

export function createBalanceView() {
    const view = document.createElement('div');
    view.className = 'balances-container';

    const sites = ['goldbet', 'bet365', 'eurobet', 'sisal', 'snai', 'lottomatica', 'cplay'];
    const balances = loadBalances();

    sites.forEach(site => {
        const card = createBalanceCard(site, balances[site]);
        card.addEventListener('click', () => {
            const currentBalance = loadBalances()[site];
            showBalanceDetails(site, currentBalance);
        });
        view.appendChild(card);
    });

    return view;
}

export async function fetchAllRecentBalances() {
    if (isFetching) {
        console.log('Richiesta già in corso, evitando duplicati.');
        return;
    }

    isFetching = true;

    try {
        const response = await fetch(`${config.apiBaseUrl}/balance-history/recent`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': '69420'
            }
        });

        if (!response.ok) {
            throw new Error(`Errore HTTP! status: ${response.status}`);
        }

        const data = await response.json();
        updateAllBalances(data);
    } catch (error) {
        console.error('Errore nel recupero dei saldi recenti:', error);
    } finally {
        isFetching = false;
    }
}

function updateAllBalances(balances) {
    for (const [site, balance] of Object.entries(balances)) {
        updateBalance(site, balance);
    }
}

function createBalanceCard(site, balance) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.site = site;

    const backgroundImage = document.createElement('img');
    backgroundImage.src = siteImages[site];
    backgroundImage.className = 'background-image';
    card.appendChild(backgroundImage);

    const balanceText = document.createElement('p');
    balanceText.className = 'balance-text';
    balanceText.textContent = balance || 'N/A';
    card.appendChild(balanceText);

    return card;
}

function createBalanceHistoryModal(site, history) {
    console.log(`Creazione del modal per ${site} con i dati:`, history);

    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const closeButton = document.createElement('span');
    closeButton.className = 'close-button';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => modalContainer.remove());
    modalContent.appendChild(closeButton);

    const title = document.createElement('h2');
    title.textContent = `Cronologia saldi per ${site}`;
    modalContent.appendChild(title);

    const balanceList = document.createElement('ul');
    balanceList.className = 'balance-list';

    if (Array.isArray(history)) {
        history.forEach(entry => {
            const listItem = document.createElement('li');
            listItem.textContent = `${formatDate(entry.date)} - ${entry.balance}`;
            balanceList.appendChild(listItem);
        });
    } else {
        const listItem = document.createElement('li');
        listItem.textContent = 'Nessuna cronologia disponibile';
        balanceList.appendChild(listItem);
    }

    modalContent.appendChild(balanceList);
    modalContainer.appendChild(modalContent);

    return modalContainer;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export async function fetchBalance(site) {
    if (fetchingStatus[site]) {
        console.log(`Richiesta per il sito ${site} già in corso, evitando duplicati.`);
        return;
    }

    fetchingStatus[site] = true;

    try {
        console.log(`Recupero saldo per il sito: ${site}`);
        const response = await fetch(`${config.apiBaseUrl}/balances/${site}`, {
            method: 'GET',
            headers: new Headers({
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': '69420'
            })
        });

        console.log('Stato della risposta:', response.status);
        console.log('Headers della risposta:', response.headers);

        if (!response.ok) {
            throw new Error(`Errore HTTP! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Dati ricevuti per il sito ${site}:`, data);

        if (data.balance === null || data.balance === undefined) {
            throw new Error('Saldo non disponibile');
        }

        updateBalance(site, data.balance);
    } catch (error) {
        console.error('Errore nel recupero del saldo:', error);
        updateBalance(site, 'Errore');
    } finally {
        fetchingStatus[site] = false;
    }
}

export async function fetchBalanceHistory(site) {
    if (isFetching) {
        console.log(`Richiesta per la cronologia del sito ${site} già in corso, evitando duplicati.`);
        return;
    }

    isFetching = true;

    try {
        const response = await fetch(`${config.apiBaseUrl}/balance-history/${site}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': '69420'
            }
        });

        if (!response.ok) {
            throw new Error(`Errore HTTP! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Dati ricevuti per ${site}:`, data);

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Cronologia non disponibile');
        }

        saveBalanceHistory(site, data);

        return data;
    } catch (error) {
        console.error('Errore nel recupero della cronologia dei saldi:', error);
        return null;
    } finally {
        isFetching = false;
    }

    updateBalance(site, data.balance);
    window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: { site, balance: data.balance } }));
}

function saveBalanceHistory(site, history) {
    const balanceHistory = loadBalanceHistory();
    balanceHistory[site] = history;
    localStorage.setItem('balanceHistory', JSON.stringify(balanceHistory));
}

export function loadBalanceHistory() {
    const balanceHistory = localStorage.getItem('balanceHistory');
    return balanceHistory ? JSON.parse(balanceHistory) : {};
}

function updateBalance(site, balanceData) {
    const balances = loadBalances();
    let balanceToDisplay = 'N/A';

    if (balanceData && typeof balanceData === 'object') {
        if (balanceData.balance) {
            balanceToDisplay = balanceData.balance;
        } else if (balanceData.date && balanceData.balance) {
            balanceToDisplay = balanceData.balance;
        }
    } else if (typeof balanceData === 'string') {
        balanceToDisplay = balanceData;
    }

    balances[site] = balanceToDisplay;
    saveBalances(balances);
    renderBalances(balances);
}

function renderBalances(balances) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const site = card.dataset.site;
        const balanceText = card.querySelector('.balance-text');
        balanceText.textContent = balances[site] || 'N/A';
    });
}

function checkAndFetchBalancesOnceADay() {
    const lastFetchDate = localStorage.getItem('lastFetchDate');
    const currentDate = new Date(getRomeTime());
    const currentHour = currentDate.getHours();

    if (lastFetchDate) {
        const lastFetch = new Date(lastFetchDate);
        const isSameDay = currentDate.toDateString() === lastFetch.toDateString();
        const isAfter10AM = currentHour >= 10;

        if (isSameDay && isAfter10AM) {
            console.log('Le route sono già state chiamate oggi dopo le 10 di mattina.');
            return;
        }
    }

    if (currentHour >= 10) {
        fetchAllSingleBoxRoutes();
        localStorage.setItem('lastFetchDate', currentDate.toISOString());
    }
}

async function fetchAllSingleBoxRoutes() {
    const sites = ['goldbet', 'bet365', 'eurobet', 'sisal', 'snai', 'lottomatica', 'cplay'];
    for (const site of sites) {
        const history = await fetchBalanceHistory(site);
        if (history) {
            const latestBalance = history[history.length - 1];
            updateBalance(site, latestBalance);
        }
    }
}

function initializeBalances() {
    const balances = loadBalances();
    renderBalances(balances);
    checkAndFetchBalancesOnceADay();
}

document.addEventListener('DOMContentLoaded', initializeBalances);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && isFetching) {
    console.log('Utente uscito dall\'app. Considero la richiesta chiusa.');
    isFetching = false;
  }
});

document.addEventListener('balanceUpdated', (event) => {
    const { site, balance } = event.detail;
    updateBalance(site, balance);
});
