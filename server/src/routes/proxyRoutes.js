const express = require('express');
const router = express.Router();
const axios = require('axios');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
const path = require('path');

// Carica i dati delle leghe
const leaguesPath = path.join(__dirname, '..', '..', 'data', 'leagues.json');
const leaguesData = JSON.parse(fs.readFileSync(leaguesPath, 'utf8'));

router.post('/sportdevs/match-results', async (req, res) => {
  await handleMatchResults(req, res, fetchFromSportDevs, filterMatchesByCompetitionSportDevs, findBestMatchSportDevs, formatMatchResultSportDevs, true);
});

router.post('/football-data/match-results', async (req, res) => {
  await handleMatchResults(req, res, fetchFromFootballData, filterMatchesByCompetitionFDATA, findBestMatchFDATA, formatMatchResultFDATA, false);
});

router.post('/football-api/match-results', async (req, res) => {
  await handleMatchResults(req, res, fetchFromFootballAPI, filterMatchesByCompetitionFAPI, findBestMatchFAPI, formatMatchResultFAPI, false);
});

async function handleMatchResults(req, res, fetchFunction, filterFunction, findBestFunction, formatMatchResultFunction, isSportsDevs) {
  const { events } = req.body;
  const differentToken = req.headers["use-different-token"] === 'true';
  const results = {};

  try {
    for (const [date, competitions] of groupEventsByDateAndCompetition(events)) {
      const matches = await fetchFunction(date, differentToken);
      for (const [competition, matchEvents] of competitions) {
        const filteredMatches = filterFunction(matches, competition);
        for (const event of matchEvents) {
          const [homeTeam, awayTeam] = event.name.split(' - ');
          const match = findBestFunction(filteredMatches, homeTeam, awayTeam);
          if (match) {
            results[event.name] = formatMatchResultFunction(match, competition);
          } else if (isSportsDevs) {
            results[event.name] = "?";
          }
        }
      }
    }
    res.json(results);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
}


function filterMatchesByCompetitionSportDevs(matchData, competition) {
  const cleanedCompetition = competition.replace('Calcio - ', '').toLowerCase();
  const matchesObject = matchData[0];
  return matchesObject.matches.filter(match => {
    if (match.league_name) {
      const similarity = stringSimilarity.compareTwoStrings(cleanedCompetition, match.league_name.toLowerCase());
      return similarity > 0.30;
    }
    else {
      return false;
    }
  });
}


function filterMatchesByCompetitionFAPI(matches, competition) {
  const cleanedCompetition = competition.replace('Calcio - ', '').toLowerCase();
  return matches.filter(match => {
    const similarity = stringSimilarity.compareTwoStrings(cleanedCompetition, match.league.name.toLowerCase());
    return similarity > 0.30; // You can adjust this threshold as needed
  });
}

function filterMatchesByCompetitionFDATA(matches, competition) {
  const cleanedCompetition = competition.replace('Calcio - ', '').toLowerCase();
  return matches.filter(match => {
    const similarity = stringSimilarity.compareTwoStrings(cleanedCompetition, match.competition.name.toLowerCase());
    return similarity > 0.30; // You can adjust this threshold as needed
  });
}


async function fetchFromSportDevs(date, differentToken = false) {
  const url = `https://football.sportdevs.com/matches-by-date?date=eq.${date}`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': 'Bearer pNVoUCBg2kaeoFcNNJpaSA'
    }
  });
  return response.data;
}

async function fetchFromFootballData(date, differentToken = false) {
  const url = `https://api.football-data.org/v4/matches?date=${date}`;
  const response = await axios.get(url, {
    headers: {
      'X-Auth-Token': '5870ff44667a451998e49aa8e5b37296'
    }
  });
  return response.data.matches;
}


async function fetchFromFootballAPI(date, differentToken = false) {
  const url = `https://v3.football.api-sports.io/fixtures?date=${date}`;
  let apiKey = `768a9443fec4b4ce3c8a3b7cbff1de19`;
  if (differentToken){
    apiKey = `477820afb5b0085835d5518f2a648917`;
  }
  const response = await axios.get(url, {
    headers: {
      'x-rapidapi-host': 'v3.football.api-sports.io',
      'x-rapidapi-key': apiKey
    }
  });
  return response.data.response;
}

function groupEventsByDateAndCompetition(events) {
  const grouped = new Map();
  for (const event of events) {
    const date = new Date(event.date).toISOString().split('T')[0];
    if (!grouped.has(date)) {
      grouped.set(date, new Map());
    }
    const dateGroup = grouped.get(date);
    if (!dateGroup.has(event.competition)) {
      dateGroup.set(event.competition, []);
    }
    dateGroup.get(event.competition).push(event);
  }
  return grouped;
}


function findBestMatchSportDevs(matches, homeTeam, awayTeam) {
  return matches.reduce((best, match) => {
    const homeScore = stringSimilarity.compareTwoStrings(homeTeam.toLowerCase(), match.home_team_name.toLowerCase());
    const awayScore = stringSimilarity.compareTwoStrings(awayTeam.toLowerCase(), match.away_team_name.toLowerCase());
    const score = homeScore + awayScore;
    return score > best.score ? { match, score } : best;
  }, { match: null, score: 0 }).match;
}

function findBestMatchFDATA(matches, homeTeam, awayTeam) {
  return matches.reduce((best, match) => {
    const homeScore = stringSimilarity.compareTwoStrings(homeTeam.toLowerCase(), match.homeTeam.name.toLowerCase());
    const awayScore = stringSimilarity.compareTwoStrings(awayTeam.toLowerCase(), match.awayTeam.name.toLowerCase());
    const score = homeScore + awayScore;
    return score > best.score ? { match, score } : best;
  }, { match: null, score: 0 }).match;
}

function findBestMatchFAPI(matches, homeTeam, awayTeam) {
  return matches.reduce((best, match) => {
    const homeScore = stringSimilarity.compareTwoStrings(homeTeam.toLowerCase(), match.teams.home.name.toLowerCase());
    const awayScore = stringSimilarity.compareTwoStrings(awayTeam.toLowerCase(), match.teams.away.name.toLowerCase());
    const score = homeScore + awayScore;
    return score > best.score ? { match, score } : best;
  }, { match: null, score: 0 }).match;
}


function formatMatchResultSportDevs(match, competition) {
  return {
    status: match.status,
    score: `${match.home_team_score} - ${match.away_team_score}`,
    competition: match.league_name,
    date: match.start_time,
  };
}

function formatMatchResultFAPI(match, competition) {
  return {
    status: match.fixture.status.long,
    score: `${match.goals.home} - ${match.goals.away}`,
    competition: match.league.name,
    date: match.fixture.date,
    minute: match.fixture.status.elapsed
  };
}

function formatMatchResultFDATA(match, competition) {
  return {
    status: match.status,
    score: `${match.score.fullTime.home} - ${match.score.fullTime.away}`,
    competition: match.competition.name,
    date: match.season.startDate
  };
}


module.exports = router;
