export function getStatusColor(status, isSolid = false) {
    let opacity = 0.35;
    if (isSolid) {
        opacity = 1;
    }
    switch (status.toLowerCase()) {
        case 'in corso':
            return `rgba(128, 128, 0, ${opacity})`; // Yellow with opacity
        case 'perdente':
        case 'perso':
            return `rgba(128, 0, 0, ${opacity})`; // Red with opacity
        case 'vincente':
        case 'vinto':
            return `rgba(0, 128, 0, ${opacity})`; // Green with opacity
        default:
            return `rgba(128, 128, 128, ${opacity})`; // Grey with opacity for unknown status
    }
}

export function showNoBetsMessage(container) {
    const message = document.createElement('div');
    message.className = 'no-bets-message';
    message.textContent = 'Nessuna scommessa attiva';
    container.appendChild(message);
}

export function formatDate(timestamp) {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function findBetInLocalStorage(betId) {
    const storedBets = JSON.parse(localStorage.getItem('activeBets') || '{}');

    for (const site in storedBets) {
        const foundBet = storedBets[site].find(bet => bet.betId === betId);
        if (foundBet) {
            return foundBet;
        }
    }

    return null; // Bet not found
}
