import config from "../../config.js";

function formatDateForInput(dateString) {
    const [date, time] = dateString.split(' ');
    const [day, month, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`;
}

function formatDateTimestamp(timestamp) {
    const date = new Date(parseInt(timestamp));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatDateForSaving(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function dateToTimestamp(dateString) {
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');

    const date = new Date(year, month - 1, day, hours, minutes);
    return date.getTime();
}


export function BetEditForm(bet, onSave) {
    const form = document.createElement('form');
    form.className = 'bet-edit-form';

    form.innerHTML = `
        <h3>Edit Bet</h3>
        <label>
            Date:
            <input type="datetime-local" name="date" value="${formatDateForInput(bet.date)}" required>
        </label>
        <label>
            Bet ID:
            <input type="text" name="betId" value="${bet.betId}" readonly>
        </label>
        <label>
            Stake:
            <input type="text" name="importoGiocato" value="${bet.importoGiocato}" required>
        </label>
        <label>
            Result:
            <select name="esitoTotale" class="esito-totale">
                <option value="Vincente" ${bet.esitoTotale === 'Vincente' ? 'selected' : ''}>Vincente</option>
                <option value="Perdente" ${bet.esitoTotale === 'Perdente' ? 'selected' : ''}>Perdente</option>
                <option value="In corso" ${bet.esitoTotale === 'In corso' ? 'selected' : ''}>In corso</option>
            </select>
        </label>
        <label>
            Total Odds:
            <input type="number" name="quotaTotale" value="${bet.quotaTotale}" step="0.01" required>
        </label>
        <label>
            Potential Win:
            <input type="text" name="vincitaPotenziale" value="${bet.vincitaPotenziale}" required>
        </label>
        <h4>Events:</h4>
        <div id="events-container"></div>
        <label>
            Latest Event Date:
            <input type="datetime-local" name="latestEventDate" value="${formatDateTimestamp(bet.latestEventDate)}" required>
        </label>
        <button type="submit">Salva</button>
        <button type="button" class="cancel-button">Annulla</button>
        <button type="button" class="delete-button">Elimina</button>
    `;

    const deleteButton = form.querySelector('.delete-button');
    deleteButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this bet?')) {
            try {
                // Delete from server
                const response = await fetch(`${config.apiBaseUrl}/bets/${bet.site}/${bet.betId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete bet from server');
                }

                // Delete from local storage
                const storedBets = JSON.parse(localStorage.getItem('activeBets') || '{}');
                const updatedStoredBets = {...storedBets};
                const site = bet.site;
                const newbet = updatedStoredBets[bet.site.toLowerCase()];
                updatedStoredBets[bet.site.toLowerCase()] = updatedStoredBets[bet.site.toLowerCase()].filter(b => b.betId !== bet.betId);
                localStorage.setItem('activeBets', JSON.stringify(updatedStoredBets));

                // Close the modal and refresh the bet list
                form.closest('.bet-edit-modal').remove();
                const event = new CustomEvent('betDeleted', { detail: bet.betId });
                window.dispatchEvent(event);
            } catch (error) {
                console.error('Error deleting bet:', error);
                alert('Failed to delete bet. Please try again.');
            }
        }
    });

    const eventsContainer = form.querySelector('#events-container');
    bet.events.forEach((event, index) => {
        const eventDiv = document.createElement('div');
        eventDiv.innerHTML = `
            <h5>Event ${index + 1}</h5>
            <label>
                Date:
                <input type="datetime-local" name="event-${index}-date" value="${formatDateTimestamp(event.date, 'YYYY-MM-DDTHH:mm')}" required>
            </label>
            <label>
                Competition:
                <input type="text" name="event-${index}-competition" value="${event.competition}" required>
            </label>
            <label>
                Name:
                <input type="text" name="event-${index}-name" value="${event.name}" required>
            </label>
            <label>
                Market Type:
                <input type="text" name="event-${index}-marketType" value="${event.marketType}" required>
            </label>
            <label>
                Selection:
                <input type="text" name="event-${index}-selection" value="${event.selection}" required>
            </label>
            <label>
                Odds:
                <input type="number" name="event-${index}-odds" value="${event.odds}" step="0.01" required>
            </label>
            <label>
                Status:
                <select name="event-${index}-status" class="event-status">
                    <option value="Vincente" ${event.status === 'Vincente' ? 'selected' : ''}>Vincente</option>
                    <option value="Perdente" ${event.status === 'Perdente' ? 'selected' : ''}>Perdente</option>
                    <option value="In corso" ${event.status === 'In corso' ? 'selected' : ''}>In corso</option>
                </select>
            </label>
            <label>
                Match Result:
                <select name="event-${index}-matchResult" class="event-matchresult">
                    <option value="N/A" ${event.matchResult === "N/A" ? 'selected' : ''}>N/A</option>
                    <option value="custom" ${event.matchResult !== "N/A" ? 'selected' : ''}>Custom</option>
                </select>
            </label>
            <div class="custom-match-result" style="display: ${event.matchResult !== "N/A" ? 'block' : 'none'}">
                <label>
                    Status:
                    <input type="text" name="event-${index}-matchResult-status" class="event-matchresult-status" 
                        value="${event.matchResult?.status || ''}">
                </label>
                <label>
                    Score:
                    <input type="text" name="event-${index}-matchResult-score" class="event-matchresult-score" 
                        value="${event.matchResult?.score || ''}">
                </label>
            </div>
        `;
        eventsContainer.appendChild(eventDiv);

        const matchResultSelect = eventDiv.querySelector(`[name="event-${index}-matchResult"]`);
        const customMatchResultDiv = eventDiv.querySelector('.custom-match-result');
        matchResultSelect.addEventListener('change', (e) => {
            customMatchResultDiv.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedBet = {...bet};
        updatedBet.date = formatDateForSaving(form.date.value);
        updatedBet.importoGiocato = form.importoGiocato.value;
        updatedBet.esitoTotale = form.esitoTotale.value || null;
        updatedBet.quotaTotale = parseFloat(form.quotaTotale.value);
        updatedBet.vincitaPotenziale = form.vincitaPotenziale.value;
        updatedBet.latestEventDate = formatDateForSaving(form.latestEventDate.value);
        updatedBet.events = bet.events.map((event, index) => ({
            ...event,
            date: dateToTimestamp(form[`event-${index}-date`].value),
            competition: form[`event-${index}-competition`].value,
            name: form[`event-${index}-name`].value,
            marketType: form[`event-${index}-marketType`].value,
            selection: form[`event-${index}-selection`].value,
            odds: parseFloat(form[`event-${index}-odds`].value).toFixed(2),
            status: form[`event-${index}-status`].value || null,
            matchResult: form[`event-${index}-matchResult`].value === 'N/A' ? "N/A" : {
                status: form[`event-${index}-matchResult-status`].value,
                score: form[`event-${index}-matchResult-score`].value,
            }
        }));
        Promise.resolve(onSave(updatedBet)).then(() => {
            const storedBets = JSON.parse(localStorage.getItem('activeBets') || '{}');
            const updatedStoredBets = {...storedBets};

            Object.keys(updatedStoredBets).forEach(site => {
                updatedStoredBets[site] = updatedStoredBets[site].map(b =>
                    b.betId === updatedBet.betId ? updatedBet : b
                );
            });
            localStorage.setItem('activeBets', JSON.stringify(updatedStoredBets));
        });
    });
    form.querySelector('.cancel-button').addEventListener('click', () => {
        form.closest('.bet-edit-modal').remove();
    });

    return form;
}
