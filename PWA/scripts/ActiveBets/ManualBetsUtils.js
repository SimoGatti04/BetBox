import {BetEditForm} from "./BetEditForm.js";
import {loadBetsFromLocalStorage, saveBetsToLocalStorage} from "./BetStorageService.js";
import {closeBetDetails, createBetDetailsScreen, handleKeyDown, updateDetailScreen} from "./BetDetailView.js";
import config from "../../config.js";
import {BET_UPDATED_EVENT} from "./BetService.js";

export function toggleEditForm(bet, detailScreen) {
    let editModal = document.querySelector('.bet-edit-modal');
    if (editModal) {
        editModal.remove();
    } else {
        editModal = document.createElement('div');
        editModal.className = 'bet-edit-modal';
        editModal.appendChild(BetEditForm(bet, (updatedBet) => saveBetChanges(updatedBet, detailScreen)));
        document.body.appendChild(editModal);
    }
}


function saveBetChanges(updatedBet, detailScreen) {
    // Update local storage
    const savedBets = loadBetsFromLocalStorage();
    const siteBets = savedBets[updatedBet.site];
    if (siteBets) {
        const betIndex = siteBets.findIndex(b => b.betId === updatedBet.betId);
        if (betIndex !== -1) {
            siteBets[betIndex] = updatedBet;
            saveBetsToLocalStorage(savedBets);
        }
    }

    // Update server
    fetch(`${config.apiBaseUrl}/bets/${updatedBet.site.toLowerCase()}/${updatedBet.betId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBet),
    })
        .then(data => {
        console.log('Bet updated successfully:', data);
        // Recreate the entire detail view
        const newDetailScreen = createBetDetailsScreen(updatedBet, false);
        detailScreen.parentNode.replaceChild(newDetailScreen, detailScreen);
        // Close the modal
        document.querySelector('.bet-edit-modal').remove();
        // Reattach event listeners
        attachDetailViewEventListeners(newDetailScreen, updatedBet);
    })
    .catch(error => console.error('Error updating bet:', error));
}

function attachDetailViewEventListeners(detailScreen, bet) {
    const keyDownHandler = handleKeyDown(detailScreen);
    const updateHandler = updateDetailScreen(bet, detailScreen, false);
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener(BET_UPDATED_EVENT, updateHandler);

    const backButton = detailScreen.querySelector('.bet-detail-back-button');
    backButton.addEventListener('click', () => closeBetDetails(detailScreen, keyDownHandler, updateHandler));
}