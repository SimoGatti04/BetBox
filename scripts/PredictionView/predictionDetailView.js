import {createPredictionPreviewView} from "./predictionPreviewView.js";

export function createPredictionDetailView(prediction) {
    const view = document.createElement('div');
    view.className = 'prediction-detail-view';

    if (prediction.response && prediction.response.length > 0) {
        const data = prediction.response[0];
        const homeTeam = data.teams.home.name;
        const awayTeam = data.teams.away.name;
        const predictionData = data.predictions;

        view.innerHTML = `
            <h2 class="section-title">${homeTeam} vs ${awayTeam}</h2>
            <div class="prediction-details">
                <p><strong>Win or Draw:</strong> ${predictionData.win_or_draw ? 'Yes' : 'No'}</p>
                <p><strong>Under/Over:</strong> ${predictionData.under_over}</p>
                <p><strong>Goals:</strong> Home - ${predictionData.goals.home || 'N/A'}, Away - ${predictionData.goals.away || 'N/A'}</p>
                <p><strong>Advice:</strong> ${predictionData.advice}</p>
                <p><strong>Percent:</strong> Home - ${predictionData.percent.home}, Draw - ${predictionData.percent.draw}, Away - ${predictionData.percent.away}</p>
            </div>
            <button id="back-button" class="btn btn-secondary">Back to Previews</button>
        `;

        const backButton = view.querySelector('#back-button');
        backButton.addEventListener('click', () => {
            document.querySelector('main#content').innerHTML = '';
            document.querySelector('main#content').appendChild(createPredictionPreviewView());
        });
    } else {
        view.innerHTML = '<p>No prediction data available</p>';
    }

    return view;
}
