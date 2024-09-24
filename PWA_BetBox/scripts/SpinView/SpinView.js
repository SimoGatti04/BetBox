import { createSpinBox } from './SpinBox.js';
import { createBonusLogModal } from '../BonusLogModal.js';
import { getRomeTime } from '../utils.js';
import config from "../../config.js";

let fetchingStatus = {};
let bonusHistory = loadSpinHistory();

export function createSpinView() {
  console.log(new Date(getRomeTime()));
  const view = document.createElement('div');
  view.className = 'spin-view';

  const sitesContainer = document.createElement('div');
  sitesContainer.className = 'sites-container';

  const sites = ['goldbet', 'lottomatica', 'snai'];
  const today =new Date(getRomeTime()).toISOString().split('T')[0];
  let shouldFetch = false;

  sites.forEach(site => {
    const lastBonus = bonusHistory[site] && bonusHistory[site].find(bonus => {
      if(bonus.result!=null){
        const isToday = bonus.date.split('T')[0] === today;
        const isValidBonus = bonus.result.tipo !== 'Nullo' && bonus.result.tipo !== 'N/A' && bonus.result.tipo !== null;
        return isToday && isValidBonus;
      }
      return false
    });

    if (!lastBonus) {
      shouldFetch = true;
    }

    const spinBox = createSpinBox(site, lastBonus, () => performSpin(site), () => openBonusLog(site));
    if (lastBonus) {
      spinBox.classList.add('bonus-today');
    }
    sitesContainer.appendChild(spinBox);
  });

  view.appendChild(sitesContainer);

  if (shouldFetch) {
    fetchSpinHistory().catch(error => console.error('Error fetching spin history:', error));
  }

  checkAndFetchMissingBonuses();

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            checkAndFetchMissingBonuses();
        }
    });

  return view;
}


function saveSpinHistory(spinHistory) {
  localStorage.setItem('spinHistory', JSON.stringify(spinHistory));
}

function loadSpinHistory() {
  const spinHistory = localStorage.getItem('spinHistory');
  return spinHistory ? JSON.parse(spinHistory) : {};
}

// Modify the fetchSpinHistory function
async function fetchSpinHistory() {
    const sites = ['goldbet', 'lottomatica', 'snai'];
    for (const site of sites) {
        if (fetchingStatus[site]) continue;

        fetchingStatus[site] = true;

        try {
            const response = await fetch(`${config.apiBaseUrl}/spin-history/${site}`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                },
            });
            const data = await response.json();
            bonusHistory[site] = data;
            updateSpinBox(site, data);
        } catch (error) {
            console.error(`Error fetching spin history for ${site}:`, error);
        } finally {
            fetchingStatus[site] = false;
        }
    }
    saveSpinHistory(bonusHistory);
}


function performSpin(site) {
    if (fetchingStatus[site]) return;

    fetchingStatus[site] = true;

    fetch(`${config.apiBaseUrl}/spin/${site}`, {
        method: 'POST',
        headers: {
            'ngrok-skip-browser-warning': 'true'
        },
    })
        .then(response => response.json())
        .then(result => {
            console.log(`Spin result for ${site}:`, result);
            bonusHistory[site] = bonusHistory[site] || [];
            bonusHistory[site].push(result);
            updateSpinBox(site, bonusHistory[site]);
            saveSpinHistory(bonusHistory);
        })
        .catch(error => {
            console.error(`Error performing spin for ${site}:`, error);
        })
        .finally(() => {
            fetchingStatus[site] = false;
        });
}

function checkAndFetchMissingBonuses() {
    const today = new Date(getRomeTime()).toISOString().split('T')[0];
    const sites = ['goldbet', 'lottomatica', 'snai'];

    sites.forEach(site => {
        const lastBonus = bonusHistory[site] && bonusHistory[site].find(bonus => {
            if(bonus.result != null){
                const isToday = bonus.date.split('T')[0] === today;
                const isValidBonus = bonus.result.tipo !== 'Nullo' && bonus.result.tipo !== 'N/A' && bonus.result.tipo !== null;
                return isToday && isValidBonus;
            }
            return false;
        });

        if (!lastBonus) {
            fetchSpinHistory(site);
        }
    });
}

function updateSpinBox(site, spinHistory) {
  const spinBox = document.querySelector(`.spin-box[data-site="${site}"]`);
  if (spinBox && spinHistory.length > 0) {
    const lastSpin = spinHistory[spinHistory.length - 1];
    const bonusValue = spinBox.querySelector('.bonus-value');
    if (bonusValue) {
      bonusValue.textContent = `${lastSpin.result ? `${lastSpin.result.tipo}: ${lastSpin.result.valore}` : 'N/A'}`;
    } else {
      console.error(`Elemento .bonus-value non trovato per il sito ${site}`);
    }
    const today = new Date(getRomeTime()).toISOString().split('T')[0];
    if (lastSpin.date.split('T')[0] === today && lastSpin.result &&
        lastSpin.result.tipo !== 'Nullo' && lastSpin.result.tipo !== 'N/A' && lastSpin.result.tipo !== null) {
      spinBox.classList.add('bonus-today');
    } else {
      spinBox.classList.remove('bonus-today');
    }
  }
}


function openBonusLog(site) {
  console.log(`Opening bonus log for site: ${site}`);
  const spinHistory = bonusHistory[site];
  if (spinHistory) {
    const modal = createBonusLogModal(site, spinHistory, formatDate, closeBonusLog);
    document.body.appendChild(modal);
    console.log(`Bonus log modal added to DOM for site: ${site}`);
  } else {
    console.error(`No bonus history found for site: ${site}`);
  }
}

function closeBonusLog() {
  const modal = document.querySelector('.modal-container');
  if (modal) {
    modal.remove();
    console.log('Bonus log modal removed from DOM');
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}



