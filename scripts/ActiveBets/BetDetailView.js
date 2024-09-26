import { formatDate, getStatusColor } from './ActiveBetsUtils.js';
import {loadBetsFromLocalStorage} from "./BetStorageService.js";
import {updateMatchResultsIfNeeded} from "./BetService.js";

const BET_UPDATED_EVENT = 'betUpdated';

export function showBetDetails(bet, isHistorical = false) {
    const detailScreen = createBetDetailsScreen(bet, isHistorical);
    detailScreen.dataset.betId = bet.betId;
    detailScreen.dataset.site = bet.site; // Assicurati che 'site' sia una proprietà di 'bet'

    const keyDownHandler = handleKeyDown(detailScreen);
    const updateHandler = updateDetailScreen(bet, detailScreen, isHistorical);

    detailScreen.style.transform = 'translateX(100%)';
    document.body.appendChild(detailScreen);

    // Trigger reflow
    detailScreen.offsetWidth;

    // Apply transition
    detailScreen.style.transition = 'transform 0.15s ease-out';
    detailScreen.style.transform = 'translateX(0)';

    window.addEventListener('keydown', keyDownHandler);
    if (!isHistorical) {
        window.addEventListener(BET_UPDATED_EVENT, updateHandler);
    }

    // Modify the back button event listener
    const backButton = detailScreen.querySelector('.bet-detail-back-button');
    backButton.addEventListener('click', () => closeBetDetails(detailScreen, keyDownHandler, updateHandler));

    setInterval(() => {
        const savedBets = loadBetsFromLocalStorage();
        updateMatchResultsIfNeeded(savedBets, bet);
    }, 60 * 1000);
}


function handleKeyDown(detailScreen) {
    return (event) => {
        if (event.key === 'ArrowLeft') {
            closeBetDetails(detailScreen);
        }
    };
}

function updateDetailScreen(bet, detailScreen, isHistorical) {
    return (event) => {
        if (!isHistorical) {
            const updatedBets = event.detail;
            const updatedBet = Object.values(updatedBets)
                .flat()
                .find(b => b.betId === bet.betId);

            if (updatedBet) {
                detailScreen.innerHTML = createBetDetailsScreen(updatedBet, isHistorical).innerHTML;
            }
        }
    };
}

function closeBetDetails(detailScreen, keyDownHandler, updateHandler) {
    detailScreen.style.transform = 'translateX(100%)';
    setTimeout(() => {
        document.body.removeChild(detailScreen);
        window.removeEventListener('keydown', keyDownHandler);
        window.removeEventListener(BET_UPDATED_EVENT, updateHandler);
    }, 150);
}

function createBetDetailContent(bet, isHistorical) {
    const eventListItems = bet.events.map(event => {
        const matchResult = event.matchResult || {};
        let isLive = ['IN_PLAY', 'LIVE', 'PAUSED', 'HALFTIME', 'FIRST HALF', 'SECOND HALF'].some(status =>
            matchResult.status && matchResult.status.toUpperCase() === status
        );
        let isNotStarted = ['NOT STARTED', 'TIMED'].some(status =>
            matchResult.status && matchResult.status.toUpperCase() === status
        );
        let resultClass = isLive ? 'result in-play' : (isNotStarted ? 'result not-started' : 'result');
        let resultString = isNotStarted ? '0-0' : (matchResult.score || '');

        let minuteString = matchResult.minute ? `${matchResult.minute}'` : '';

        return `
            <li class="event-item">
                <div class="event-details">
                    <p class="event-name"><strong>${event.name}</strong></p>
                    <p class="event-date">${formatDate(event.date)}</p>
                    <p class="event-selection">${event.marketType}: ${event.selection}</p>
                    <div class="event-odds" style="color: ${getStatusColor(event.status, true)}">${event.odds}</div>
                    <div class="${resultClass}">${resultString}</div>
                    <div class="event-minute">${minuteString}</div>
                </div>
            </li>
        `;
    });

    return `
        <div class="bet-summary">
            <span class="bet-stake-odds">${bet.importoGiocato}@${bet.quotaTotale}</span>
        </div>
        <div class="bet-detail-header">
            <h2 class="bet-potential-win" style="color: ${getStatusColor(bet.esitoTotale, true)}">
                    ${bet.vincitaPotenziale}</h2>
        </div>
        <div class="bet-detail-content">
            <ul class="event-list">
                ${eventListItems.join('')}
            </ul>
        </div>
    `;
}

function createBetDetailsScreen(bet, isHistorical = false) {
    const detailScreen = document.createElement('div');
    detailScreen.className = 'bet-detail-screen';

    const backButton = document.createElement('button');
    backButton.className = 'bet-detail-back-button';
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
    backButton.addEventListener('click', () => closeBetDetails(detailScreen));

    const content = document.createElement('div');
    content.innerHTML = createBetDetailContent(bet, isHistorical);

    detailScreen.appendChild(backButton);
    detailScreen.appendChild(content);

    return detailScreen;
}