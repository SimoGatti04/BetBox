const express = require('express');
const router = express.Router();
const axios = require('axios');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
const path = require('path');

// Carica i dati delle leghe
const leaguesPath = path.join(__dirname, '..', '..', 'data', 'leagues.json');
const leaguesData = JSON.parse(fs.readFileSync(leaguesPath, 'utf8'));

function getLeagueId(competitionName) {
  const league = leaguesData.find(l => l.name.toLowerCase() === competitionName.toLowerCase());
  return league ? league.id : null;
}

router.post('/football-data/match-results', async (req, res) => {
  await handleMatchResults(req, res, fetchFromFootballData, filterMatchesByCompetitionFDATA, findBestMatchFDATA, formatMatchResultFDATA, false);
});

router.post('/football-api/match-results', async (req, res) => {
  await handleMatchResults(req, res, fetchFromFootballAPI, filterMatchesByCompetitionFAPI, findBestMatchFAPI, formatMatchResultFAPI, true);
});

async function handleMatchResults(req, res, fetchFunction, filterFunction, findBestFunction, formatMatchResultFunction, isFootballAPI) {
  const { events } = req.body;
  const results = {};

  try {
    for (const [date, competitions] of groupEventsByDateAndCompetition(events)) {
      const matches = await fetchFunction(date);
      for (const [competition, matchEvents] of competitions) {
        const filteredMatches = filterFunction(matches, competition);
        for (const event of matchEvents) {
          const [homeTeam, awayTeam] = event.name.split(' - ');
          const match = findBestFunction(filteredMatches, homeTeam, awayTeam);
          if (match) {
            results[event.name] = formatMatchResultFunction(match, competition);
          } else if (isFootballAPI) {
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



async function fetchFromFootballData(date) {
  const url = `https://api.football-data.org/v4/matches?date=${date}`;
  const response = await axios.get(url, {
    headers: {
      'X-Auth-Token': '5870ff44667a451998e49aa8e5b37296'
    }
  });
  return response.data.matches;
}


async function fetchFromFootballAPI(date) {
  const url = `https://v3.football.api-sports.io/fixtures?date=${date}`;
  const response = await axios.get(url, {
    headers: {
      'x-rapidapi-host': 'v3.football.api-sports.io',
      'x-rapidapi-key': '768a9443fec4b4ce3c8a3b7cbff1de19'
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

function findBestMatchFAPI(matches, homeTeam, awayTeam) {
  return matches.reduce((best, match) => {
    const homeScore = stringSimilarity.compareTwoStrings(homeTeam, match.teams.home.name);
    const awayScore = stringSimilarity.compareTwoStrings(awayTeam, match.teams.away.name);
    const score = homeScore + awayScore;
    return score > best.score ? { match, score } : best;
  }, { match: null, score: 0 }).match;
}

function findBestMatchFDATA(matches, homeTeam, awayTeam) {
  return matches.reduce((best, match) => {
    const homeScore = stringSimilarity.compareTwoStrings(homeTeam, match.homeTeam.name);
    const awayScore = stringSimilarity.compareTwoStrings(awayTeam, match.awayTeam.name);
    const score = homeScore + awayScore;
    return score > best.score ? { match, score } : best;
  }, { match: null, score: 0 }).match;
}

function formatMatchResultFAPI(match, competition) {
  return {
    status: match.fixture.status.long,
    score: `${match.score.fulltime.home} - ${match.score.fulltime.away}`,
    competition: match.league.name,
    date: match.fixture.date
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

function getCompetitionCode(competition) {
  const competitionMap = {
    'FIFA World Cup': 'WC',
    'UEFA Champions League': 'CL',
    'Bundesliga': 'BL1',
    'Eredivisie': 'DED',
    'Campeonato Brasileiro Serie A': 'BSA',
    'Primera Division': 'PD',
    'Ligue 1': 'FL1',
    'Championship': 'ELC',
    'Primeira Liga': 'PPL',
    'European Championship': 'EC',
    'Serie A': 'SA',
    'Premier League': 'PL',
    'Copa Libertadores': 'CLI'
  };

  const competitionName = competition.replace('Calcio - ', '');
  return competitionMap[competitionName] || null;
}

module.exports = router;
