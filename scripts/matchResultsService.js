import config from '../config.js';
import { LIVE_STATUSES, UPCOMING_STATUSES, FINISHED_STATUSES} from "./ActiveBets/BetService.js";

async function getMatchResult(events) {
    const now = Date.now();
    const eventsToFetch = events.filter(event => needsFetching(event, now));

    if (eventsToFetch.length === 0) {
        return events.map(e => e.matchResult);
    }

    try {
        // First, try to get results from SportDevs API
        let results = await getResultsFromFootballAPI(eventsToFetch);
        let remainingEvents = eventsToFetch.filter(e => !results[e.name]);

        // If there are any remaining events, try Football-Data API
        if (remainingEvents.length > 0) {
            const footballDataResults = await getResultsFromFootballData(remainingEvents);
            results = { ...results, ...footballDataResults };
            remainingEvents = remainingEvents.filter(e => !results[e.name]);
        }

        // If there are still remaining events, try Football API
        if (remainingEvents.length > 0) {
            const footballAPIResults = await getResultsFromSportDevs(remainingEvents);
            results = { ...results, ...footballAPIResults };
        }

        updateEventResults(events, results, now);
        return events.map(e => e.matchResult);
    } catch (error) {
        console.error('Error fetching match results:', error);
        return events.map(e => e.matchResult || null);
    }
}

function needsFetching(event, now) {
    const { matchResult } = event;
    if (!matchResult || matchResult === 'N/A') return true;
    if (FINISHED_STATUSES.includes(matchResult.status.toUpperCase())) return false;
    return !((LIVE_STATUSES.includes(matchResult.status.toUpperCase())
        && now - matchResult.lastUpdated < 60 * 1000));
}

async function getResultsFromSportDevs(events) {
    return await fetchResults(`${config.apiBaseUrl}/proxy/sportdevs/match-results`, events);
}

async function getResultsFromFootballData(events) {
    return await fetchResults(`${config.apiBaseUrl}/proxy/football-data/match-results`, events);
}

async function getResultsFromFootballAPI(events) {
    return await fetchResults(`${config.apiBaseUrl}/proxy/football-api/match-results`, events);
}

async function fetchResults(url, events) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
}

function updateEventResults(events, results, now) {
    events.forEach(event => {
        if (results[event.name]) {
            event.matchResult = {
                ...results[event.name],
                lastUpdated: now
            };
        }
    });
}

export { getMatchResult };
