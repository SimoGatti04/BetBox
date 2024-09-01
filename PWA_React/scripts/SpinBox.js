import { siteImages } from './siteImages.js';

export function createSpinBox(site, lastBonus, onSpin, onViewHistory) {
  const box = document.createElement('div');
  box.className = 'card spin-box';
  box.dataset.site = site;

  const topRow = document.createElement('div');
  topRow.className = 'top-row';

  const logo = document.createElement('img');
  logo.src = siteImages[site];
  logo.className = 'icon';
  topRow.appendChild(logo);

  const spinButton = document.createElement('span');
  spinButton.className = 'spin-button';
  spinButton.textContent = '↻';
  spinButton.addEventListener('click', onSpin);
  topRow.appendChild(spinButton);

  box.appendChild(topRow);

  const bonusText = document.createElement('p');
  bonusText.className = 'bonus-text';
  bonusText.textContent = `Ultimo bonus: ${renderBonus(lastBonus)}`;
  box.appendChild(bonusText);

  const historyButton = document.createElement('span');
  historyButton.className = 'history-button';
  historyButton.textContent = 'Visualizza cronologia';
  historyButton.addEventListener('click', onViewHistory);
  box.appendChild(historyButton);

  return box;
}

function renderBonus(lastBonus) {
  if (lastBonus && lastBonus.result) {
    return `${lastBonus.result.tipo}: ${lastBonus.result.valore}`;
  }
  return 'N/A';
}
