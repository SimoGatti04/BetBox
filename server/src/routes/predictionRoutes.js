const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const RequestQueue = require("../utils/requestQueue");

const requestQueue = new RequestQueue();

router.post('/football-data', async (req, res) => {
    requestQueue.enqueue(async () => {
        const {team1, team2, matchDate} = req.body;
        const prediction = await getMatchPrediction(team1, team2, matchDate);
        res.json(prediction);
    });
})

router.get('/:team1/:team2', async (req, res) => {
  const { team1, team2 } = req.params;
  const filename = path.join(__dirname, '..', '..', 'data', 'predictions', `prediction_${team1.toLowerCase()}_vs_${team2.toLowerCase()}.json`);

  try {
    const data = await fs.readFile(filename, 'utf8');
    const prediction = JSON.parse(data);

    if (prediction.response && prediction.response.length > 0) {
      const predictionData = prediction.response[0];
      const relevantData = {
        win_or_draw: predictionData.predictions.win_or_draw,
        under_over: predictionData.predictions.under_over,
        goals: predictionData.predictions.goals,
        advice: predictionData.predictions.advice,
        percent: predictionData.predictions.percent
      };
      res.json(relevantData);
    } else {
      res.status(404).json({ error: 'Prediction data not found in the response' });
    }
  } catch (error) {
    res.status(404).json({ error: 'Prediction file not found' });
  }
});

router.get('/all', async (req, res) => {
    const predictionsDir = path.join(__dirname, '..', '..', 'data', 'predictions');
    try {
        const files = await fs.readdir(predictionsDir);
        const predictions = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(predictionsDir, file);
                const data = await fs.readFile(filePath, 'utf8');
                return JSON.parse(data);
            })
        );
        res.json(predictions);
    } catch (error) {
        console.error('Error reading predictions:', error);
        res.status(500).json({ error: 'Failed to retrieve predictions' });
    }
});

async function getMatchPrediction(team1, team2, matchDate) {
    const filename = path.join(__dirname, '..', '..', 'data', 'predictions', `prediction_${team1.toLowerCase()}_vs_${team2.toLowerCase()}_${matchDate}.json`);

    // Check if prediction is already cached
    try {
        const data = await fs.readFile(filename, 'utf8');
        const cachedPrediction = JSON.parse(data);
        if (cachedPrediction && cachedPrediction.response) {
            console.log(`Reading file: ${filename}`);
            return cachedPrediction;
        }
    } catch (error) {
        console.log('No cached prediction found');
    }

    // If not cached, fetch from API
    const API_KEY = '768a9443fec4b4ce3c8a3b7cbff1de19';
    const headers = {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY
    };

    // Get fixture ID
    const fixtureResponse = await fetch(`https://v3.football.api-sports.io/fixtures?date=${matchDate}`, {headers});
    const fixtureData = await fixtureResponse.json();

    let bestMatch = null;
    let highestSimilarity = 0;

    fixtureData.response.forEach(fixture => {
        const homeSimilarity = similarity(team1, fixture.teams.home.name);
        const awaySimilarity = similarity(team2, fixture.teams.away.name);
        const totalSimilarity = homeSimilarity + awaySimilarity;

        if (totalSimilarity > highestSimilarity) {
            highestSimilarity = totalSimilarity;
            bestMatch = fixture.fixture.id;
        }
    });

    // Get prediction
    await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for 15 seconds
    const predictionResponse = await fetch(`https://v3.football.api-sports.io/predictions?fixture=${bestMatch}`, {headers});
    const predictionData = await predictionResponse.json();

    // Add matchDate to the prediction data
    predictionData.matchDate = matchDate;

    if (predictionData.errors.length === 0){
        try {
            const dir = path.dirname(filename);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(filename, JSON.stringify(predictionData, null, 2));
            console.log(`Prediction saved to ${filename}`);
        } catch (error) {
            console.error('Error saving prediction:', error);
        }
    }

    // Cache the prediction
    return predictionData;
}

// Helper function to calculate string similarity
function similarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) {
            costs[s2.length] = lastValue;
        }
    }
    return costs[s2.length];
}

module.exports = { router, getMatchPrediction }