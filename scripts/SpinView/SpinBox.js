import { siteImages } from '../siteImages.js';

export function createSpinBox(site, lastBonus, onSpinClick, onViewLogClick) {
  const box = document.createElement('div');
  box.className = 'card spin-box';
  box.dataset.site = site;

  const topRow = document.createElement('div');
  topRow.className = 'top-row';

  const icon = document.createElement('img');
  icon.src = siteImages[site];
  icon.className = 'icon';
  topRow.appendChild(icon);

  const spinButton = document.createElement('button');
  spinButton.className = 'spin-button';
  spinButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
  spinButton.addEventListener('click', onSpinClick);
  topRow.appendChild(spinButton);

  box.appendChild(topRow);

  const bonusContainer = document.createElement('div');
  bonusContainer.className = 'bonus-container';

  const bonusLabel = document.createElement('p');
  bonusLabel.className = 'bonus-label';
  bonusLabel.textContent = 'Ultimo bonus:';
  bonusContainer.appendChild(bonusLabel);

  const bonusValue = document.createElement('p');
  bonusValue.className = 'bonus-value';
  bonusValue.textContent = lastBonus && lastBonus.result ? `${lastBonus.result.tipo}: ${lastBonus.result.valore}` : 'N/A';
  bonusContainer.appendChild(bonusValue);

  box.appendChild(bonusContainer);

  const viewLogButton = document.createElement('button');
  viewLogButton.className = 'view-log-button';
  viewLogButton.textContent = 'Visualizza contenuto';
  viewLogButton.addEventListener('click', onViewLogClick);
  box.appendChild(viewLogButton);

  return box;
}



function renderBonus(lastBonus) {
  if (lastBonus && lastBonus.result) {
    return `${lastBonus.result.tipo}: ${lastBonus.result.valore}`;
  }
  return 'N/A';
}
