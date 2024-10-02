import config from "../../config.js";
import { createPredictionDetailView } from './predictionDetailView.js';

export function createPredictionPreviewView() {
    const view = document.createElement('div');
    view.className = 'prediction-preview-view';
    view.innerHTML = `
        <div id="prediction-form-container" class="form-container"></div>
        <div id="prediction-previews" class="prediction-list"></div>
    `;

    const formContainer = view.querySelector('#prediction-form-container');
    formContainer.appendChild(createPredictionForm());

    fetchPredictionPreviews(view);

    return view;
}

function createPredictionForm() {
    const form = document.createElement('form');
    form.className = 'prediction-form';
    const today = new Date().toISOString().split('T')[0];
    form.innerHTML = `
        <input type="text" id="team1" class="input-field" placeholder="Home Team" required>
        <input type="text" id="team2" class="input-field" placeholder="Away Team" required>
        <input type="date" id="match-date" class="input-field" value="${today}" required>
        <button type="submit" class="btn btn-primary">Get Prediction</button>
    `;

    form.addEventListener('submit', handlePredictionSubmit);
    return form;
}

async function handlePredictionSubmit(e) {
    e.preventDefault();
    const team1 = e.target.querySelector('#team1').value;
    const team2 = e.target.querySelector('#team2').value;
    const matchDate = e.target.querySelector('#match-date').value;

    try {
        const response = await fetch(`${config.apiBaseUrl}/predictions/football-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team1, team2, matchDate })
        });
        const data = await response.json();
        displayPredictionPreview(data);
    } catch (error) {
        console.error('Error fetching prediction:', error);
    }
}

async function fetchPredictionPreviews(view) {
    try {
        const response = await fetch(`${config.apiBaseUrl}/predictions/all`);
        const predictions = await response.json();
        predictions.forEach(prediction => displayPredictionPreview(prediction, view));
    } catch (error) {
        console.error('Error fetching prediction previews:', error);
    }
}

function displayPredictionPreview(data, view) {
    const previewsContainer = view.querySelector('#prediction-previews');
    const previewElement = document.createElement('div');
    previewElement.className = 'prediction-card';

    if (data.response && data.response.length > 0) {
        const prediction = data.response[0].predictions;
        const homeTeam = data.response[0].teams.home.name;
        const awayTeam = data.response[0].teams.away.name;

        previewElement.innerHTML = `
            <h3 class="prediction-title">${homeTeam} vs ${awayTeam}</h3>
            <p class="prediction-advice">Advice: ${prediction.advice}</p>
        `;

        previewElement.addEventListener('click', () => showFullPrediction(data));
    } else {
        previewElement.innerHTML = '<p>No prediction data available</p>';
    }

    previewsContainer.appendChild(previewElement);
}

function showFullPrediction(data) {
    const contentContainer = document.querySelector('main#content');
    contentContainer.innerHTML = '';
    contentContainer.appendChild(createPredictionDetailView(data));
}
