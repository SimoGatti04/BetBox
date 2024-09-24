export function createBonusLogModal(site, spinHistory, formatDate, closeBonusLog) {
  console.log(`Creating bonus log modal for site: ${site}`);
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-container';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  const closeButton = document.createElement('span');
  closeButton.className = 'close-button';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', closeBonusLog);
  modalContent.appendChild(closeButton);

  const title = document.createElement('h2');
  title.textContent = `Cronologia dei bonus per ${site}`;
  modalContent.appendChild(title);

  const bonusList = document.createElement('ul');
  bonusList.className = 'bonus-list';

  spinHistory.forEach(bonus => {
    const tipo = bonus.result && bonus.result.tipo ? bonus.result.tipo : 'N/A';
    const valore = bonus.result && bonus.result.valore ? bonus.result.valore : 'N/A';
    const listItem = document.createElement('li');
    listItem.textContent = `${formatDate(bonus.date)} - ${tipo}: ${valore}`;
    bonusList.appendChild(listItem);
  });

  modalContent.appendChild(bonusList);
  modalContainer.appendChild(modalContent);

  console.log(`Bonus log modal created for site: ${site}`);
  return modalContainer;
}
