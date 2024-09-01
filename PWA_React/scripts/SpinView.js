import { createSpinBox } from './SpinBox.js';
import { createBonusLogModal } from './BonusLogModal.js';

export function createSpinView() {
  const view = document.createElement('div');
  view.className = 'spin-view';

  const sitesContainer = document.createElement('div');
  sitesContainer.className = 'sites-container';

  const sites = ['goldbet', 'lottomatica', 'snai'];
  sites.forEach(site => {
    const spinBox = createSpinBox(site, null, () => performSpin(site), () => openBonusLog(site));
    sitesContainer.appendChild(spinBox);
  });

  view.appendChild(sitesContainer);

  new Isotope(sitesContainer, {
    itemSelector: '.spin-box',
    layoutMode: 'vertical',
    resize: false,
    fitWidth: false,
    transitionDuration: 0
  });


  return view;
}

function fetchSpinHistory() {
  const sites = ['goldbet', 'lottomatica', 'snai'];
  sites.forEach(site => {
    fetch(`https://legally-modest-joey.ngrok-free.app/spin-history/${site}`)
      .then(response => response.json())
      .then(data => updateSpinBox(site, data))
      .catch(error => console.error(`Error fetching spin history for ${site}:`, error));
  });
}

function performSpin(site) {
  fetch(`https://legally-modest-joey.ngrok-free.app/spin/${site}`, { method: 'POST' })
    .then(response => response.json())
    .then(result => {
      console.log(`Spin result for ${site}:`, result);
      fetchSpinHistory();
    })
    .catch(error => console.error(`Error performing spin for ${site}:`, error));
}

function updateSpinBox(site, spinHistory) {
  const spinBox = document.querySelector(`.spin-box[data-site="${site}"]`);
  if (spinBox && spinHistory.length > 0) {
    const lastSpin = spinHistory[spinHistory.length - 1];
    const bonusText = spinBox.querySelector('.bonus-text');
    bonusText.textContent = `Ultimo bonus: ${lastSpin.result.tipo}: ${lastSpin.result.valore}`;
  }
}

function openBonusLog(site) {
  fetch(`https://legally-modest-joey.ngrok-free.app/spin-history/${site}`)
    .then(response => response.json())
    .then(spinHistory => {
      const modal = createBonusLogModal(site, spinHistory, formatDate, closeBonusLog);
      document.body.appendChild(modal);
    })
    .catch(error => console.error(`Error fetching spin history for ${site}:`, error));
}

function closeBonusLog() {
  const modal = document.querySelector('.modal-container');
  if (modal) {
    modal.remove();
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
