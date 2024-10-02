import { siteImages } from '../siteImages.js';
import {
    recoverActiveBets,
    refreshAllBets,
    updateMatchResultsIfNeeded,
    updateSiteBets
} from "./BetService.js";
import {cleanupRemovedBets, loadBetsFromLocalStorage, loadRemovedBetsFromLocalStorage} from "./BetStorageService.js";
import { showBetDetails } from './BetDetailView.js';
import { formatDate, getStatusColor, showNoBetsMessage } from "./ActiveBetsUtils.js";

let removedBets = {};

export function createActiveBetsView() {
    const view = document.createElement('div');
    view.className = 'active-bets-view';

    const header = createHeader();

    const betList = document.createElement('div');
    betList.className = 'bet-list';

    const historyButton = document.createElement('button');
    historyButton.className = 'bet-history-button';
    historyButton.innerHTML = '<i class="fas fa-clipboard-list"></i>';
    historyButton.addEventListener('click', showBetHistory);

    const menu = createMenu();

    view.appendChild(header);
    view.appendChild(menu);
    view.appendChild(betList);
    view.appendChild(historyButton);

    // Load and render saved bets immediately
    const savedBets = loadBetsFromLocalStorage();
    removedBets = loadRemovedBetsFromLocalStorage();

    if (Object.keys(savedBets).length > 0) {
        renderBetList(savedBets, betList);
    }

    updateMatchResultsIfNeeded(savedBets, betList);

    setInterval(() => {
        const savedBets = loadBetsFromLocalStorage();
        updateMatchResultsIfNeeded(savedBets, betList);
    }, 60 * 1000);


    return view;
}

function createHeader() {
    const header = document.createElement('div');

    header.className = 'active-bets-header';

    const fetchButton = createButton('fetch-bets-button', 'fa-play', recoverActiveBets);
    const refreshButton = createButton('refresh-bets-button', 'fa-sync-alt', refreshAllBets);
    const menuButton = createButton('menu-button', 'fa-ellipsis-v', toggleMenu);

    header.appendChild(fetchButton);
    header.appendChild(refreshButton);
    header.appendChild(menuButton);

    return header;
}

function createMenu() {
    const header = document.createElement('div');
    header.className = 'update-menu-header';

    const titleText = document.createElement('h1');
    titleText.textContent = 'Aggiorna Bets';
    titleText.className = 'update-menu-title';

    header.appendChild(titleText);

    const sites = ['goldbet', 'bet365', 'eurobet', 'sisal', 'snai', 'lottomatica', 'cplay'];
    const menu = document.createElement('div');
    menu.appendChild(header);
    menu.className = 'update-menu overlay';
    menu.style.display = 'none';


    for (let i = 0; i < sites.length; i += 2) {
        const row = document.createElement('div');
        row.className = 'menu-row';

        for (let j = i; j < Math.min(i + 2, sites.length); j++) {
            const site = sites[j];
            const item = document.createElement('div');
            item.className = 'menu-item';

            const img = document.createElement('img');
            img.src = siteImages[site];
            img.alt = `Update ${site}`;
            img.title = `Update ${site}`;

            item.appendChild(img);
            item.addEventListener('click', () => {
                updateSiteBets(site);
                toggleMenu();
            });
            row.appendChild(item);
        }

        menu.appendChild(row);
    }

    return menu;
}

function showBetHistory() {
    const removedBets = loadRemovedBetsFromLocalStorage();
    const historyModal = createBetHistoryModal(removedBets);
    document.body.appendChild(historyModal);
}

function toggleMenu() {
    const menu = document.querySelector('.update-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function createBetHistoryModal(history) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'bet-history-container';

    const modalContent = document.createElement('div');
    modalContent.className = 'bet-history-content';

    const headerContainer = document.createElement('div');
    headerContainer.className = 'bet-history-header';

    const title = document.createElement('h2');
    title.textContent = 'Cronologia Bets';

    const cleanupButton = document.createElement('button');
    cleanupButton.className = 'cleanup-button';
    cleanupButton.innerHTML = '<i class="fas fa-trash"></i>';
    cleanupButton.addEventListener('click', manualCleanupRemovedBets);

    headerContainer.appendChild(title);

    const closeButton = document.createElement('span');
    closeButton.className = 'close-button';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => modalContainer.remove());

    modalContent.appendChild(headerContainer);
    modalContent.appendChild(closeButton);

    const historyList = document.createElement('div');
    historyList.className = 'bet-list history-list scrollable-content';

    for (const site in history) {
        history[site].forEach(bet => {
            const betPreview = createBetPreview(site, bet);
            historyList.appendChild(betPreview);
        });
    }

    const bottomBar = document.createElement('div');
    bottomBar.className = 'bottom-bet-history-bar';

    bottomBar.appendChild(cleanupButton)

    modalContent.appendChild(historyList);
    modalContent.appendChild(bottomBar);

    modalContainer.appendChild(modalContent);

    cleanupRemovedBets();

    return modalContainer;
}

function manualCleanupRemovedBets() {
    localStorage.removeItem('removedBets');
    const historyModal = document.querySelector('.bet-history-container');
    if (historyModal) {
        historyModal.remove();
        showBetHistory();
    }
}

function createButton(id, iconClass, onClick) {
    const button = document.createElement('button');
    button.id = id;
    const icon = document.createElement('i');
    icon.className = `fas ${iconClass}`;
    button.appendChild(icon);
    button.addEventListener('click', onClick);
    return button;
}

export function renderBetList(bets, container) {
    container.innerHTML = '';
    let hasBets = false;

    Object.entries(bets).forEach(([site, siteBets]) => {
        if (siteBets.length > 0) {
            hasBets = true;
            siteBets.forEach(bet => {
                const betPreview = createBetPreview(site, bet);
                container.appendChild(betPreview);
            });
        }
    });

    if (!hasBets) {
        showNoBetsMessage(container);
    }
}

function createBetPreview(site, bet) {
    const preview = document.createElement('div');
    preview.className = 'bet-preview';
    preview.style.backgroundColor = getStatusColor(bet.esitoTotale);
    preview.innerHTML = `
        <img src="${siteImages[site.toLowerCase()]}" alt="${site} logo" class="site-logo">
        <div class="bet-info">
            <p class="potential-win">${bet.vincitaPotenziale}</p>
            <p class="bet-amount">${bet.importoGiocato}@${bet.quotaTotale}</p>
            ${bet.removedAt ? `<p class="removed-date">Rimossa: ${formatDate(bet.removedAt)}</p>` : ''}
        </div>
    `;
    preview.addEventListener('click', () => showBetDetails(bet, true));
    return preview;
}

document.addEventListener('betDeleted', (event) => {
    const deletedBetId = event.detail;
    // Refresh the bet list or update the UI as needed
    renderBetList(); // Assuming you have a function to re-render the bet list
});
