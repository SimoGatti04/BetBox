import config from '../../config.js';
import { getMatchResult } from '../matchResultsService.js';
import {
    loadBetsFromLocalStorage,
    loadRemovedBetsFromLocalStorage,
    saveBetsToLocalStorage,
    saveRemovedBetsToLocalStorage
} from "./BetStorageService.js";
import { renderBetList } from "./ActiveBetsView.js";
import { getRomeTime } from '../utils.js';

export const BET_UPDATED_EVENT = 'betUpdated';
export const LIVE_STATUSES = ['IN_PLAY', 'LIVE', 'PAUSED', 'HALFTIME', 'FIRST HALF', 'SECOND HALF'];
export const UPCOMING_STATUSES = ['NOT STARTED', 'TIMED', 'MATCH POSTPONED', 'DELAYED', 'POSTPONED'];
export const FINISHED_STATUSES = ['FINISHED', 'CANCELED', 'POSTPONED', 'SUSPENDED', 'ABANDONED', 'VOID', 'CANCELLED']
let isUpdatingMatchResults = false;


export async function recoverActiveBets() {
    try {
        const response = await fetch(`${config.apiBaseUrl}/bets/fetch-active-bets`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': '69420'
            },
        });
        const result = await response.json();
        console.log('Scommesse attive recuperate:', result);
    } catch (error) {
        console.error('Errore nel recupero delle scommesse attive:', error);
    }
}

export async function refreshAllBets() {
    try {
        const savedBets = loadBetsFromLocalStorage();
        const response = await fetch(`${config.apiBaseUrl}/bets/all-active-bets`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': '69420'
            },
            body: JSON.stringify({ appBets: savedBets }),
        });
        const comparison = await response.json();
        const updatedBets = mergeServerAndLocalBets(savedBets, comparison);
        const betList = document.querySelector('.bet-list');
        renderBetList(updatedBets, betList);
        saveBetsToLocalStorage(updatedBets);
        updateMatchResultsIfNeeded(updatedBets, betList);
    } catch (error) {
        console.error('Errore nel refresh delle scommesse:', error);
        const savedBets = loadBetsFromLocalStorage();
        renderBetList(savedBets, document.querySelector('.bet-list'));
    }
}

export async function updateSiteBets(site) {
    try {
        const response = await fetch(`${config.apiBaseUrl}/bets/${site}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': '69420'
            },
        });
        const result = await response.json();
        console.log(`Active bets updated for ${site}:`, result);
        await refreshAllBets();
    } catch (error) {
        console.error(`Error updating active bets for ${site}:`, error);
    }
}

export function updateMatchResultsIfNeeded(bets, betList) {
    if (isUpdatingMatchResults) {
        return; // Don't start a new update if one is already in progress
    }

    const now = new Date(getRomeTime()).getTime();
    const lastRequestTime = localStorage.getItem('lastResultRequestTime') || 0;
    const oneMinute = 60 * 1000;

    const eventsToUpdate = Object.values(bets).flatMap(site =>
        Object.values(site).flatMap(bet =>
            bet && bet.events ? bet.events.filter(event => {
                if (!event.matchResult || event.matchResult === "N/A"
                    || UPCOMING_STATUSES.includes(event.matchResult?.status?.toUpperCase())) {
                    console.log("Passato da NOT STARTED")
                    const eventDate = event.date;
                    return now >= eventDate;
                }
                if (LIVE_STATUSES.includes(event.matchResult?.status?.toUpperCase())) {
                    console.log("Passato da IN PLAY")
                    return now - lastRequestTime >= oneMinute;
                }
                return false; // Don't update finished matches
            }) : []
        )
    );

     if (eventsToUpdate.length > 0) {
        isUpdatingMatchResults = true;
        updateMatchResults(eventsToUpdate, bets, betList)
            .then(() => {
                localStorage.setItem('lastResultRequestTime', now.toString());
            })
            .finally(() => {
                isUpdatingMatchResults = false;
            });
    }
}

export async function updateMatchResults(events, bets, betList) {
    const updatedResults = await getMatchResult(events);

    for (const site in bets) {
        bets[site] = bets[site].map(bet => ({
            ...bet,
            events: bet.events.map(event => {
                const updatedResult = updatedResults.find(r => r.name === event.name);
                return updatedResult ? { ...event, matchResult: updatedResult } : event;
            })
        }));
    }

    localStorage.setItem('lastResultRequestTime', new Date(getRomeTime()).getTime().toString());
    saveBetsToLocalStorage(bets);
    renderBetList(bets, betList);
    document.dispatchEvent(new CustomEvent(BET_UPDATED_EVENT, { detail: bets }));
}


export function mergeServerAndLocalBets(savedBets, comparison) {
    const updatedBets = { ...savedBets };
    const now = Date.now();
    let removedBets = loadRemovedBetsFromLocalStorage();

    for (const site in comparison) {
        updatedBets[site] = updatedBets[site] || [];
        removedBets[site] = removedBets[site] || [];

        comparison[site].toRemove.forEach(betId => {
            const removedBet = updatedBets[site].find(bet => bet.betId === betId);
            if (removedBet) {
                removedBets[site].push({
                    ...removedBet,
                    removedAt: now
                });
            }
        });

        updatedBets[site] = updatedBets[site].filter(bet =>
            !comparison[site].toRemove.includes(bet.betId)
        );

        comparison[site].toKeep.forEach(serverBet => {
            const localBet = updatedBets[site].find(bet => bet.betId === serverBet.betId);
            if (localBet) {
                localBet.esitoTotale = serverBet.esitoTotale;
                serverBet.events.forEach(serverEvent => {
                    const localEvent = localBet.events.find(event => event.name === serverEvent.name);
                    if (localEvent) {
                        localEvent.status = serverEvent.status;
                    }
                });
            }
        });

        updatedBets[site].push(...comparison[site].toAdd);
    }

    saveRemovedBetsToLocalStorage(removedBets);
    return updatedBets;
}


export function updateBetDetailView(updatedBet) {
    const detailView = document.querySelector('.bet-detail-screen');
    if (!detailView) return;

    updatedBet.events.forEach(event => {
        const eventElement = Array.from(detailView.querySelectorAll('.event-name')).find(el => el.textContent.includes(event.name));
        if (eventElement) {
            const resultElement = eventElement.closest('.event-item').querySelector('.result');
            if (resultElement) {
                resultElement.textContent = event.matchResult?.score;
                resultElement.className = `result ${getStatusClass(event.matchResult?.status)}`;
            }
        }
    });
}

function getStatusClass(status) {
    if (!status) return '';
    status = status.toUpperCase();
    if (LIVE_STATUSES.includes(status.toUpperCase())) return 'in-play';
    if (UPCOMING_STATUSES.includes(status.toUpperCase())) return 'not-started';
    return '';
}

document.addEventListener(BET_UPDATED_EVENT, (event) => {
    const updatedBets = event.detail;
    const openBetDetail = document.querySelector('.bet-detail-screen');
    if (openBetDetail) {
        const betId = openBetDetail.dataset.betId;
        const site = openBetDetail.dataset.site.toLowerCase();
        const updatedBet = updatedBets[site]?.find(bet => bet.betId === betId);
        if (updatedBet) {
            updateBetDetailView(updatedBet, openBetDetail);
        }
    }
});
