// src/components/bonusLogModal.js

export function createBonusLogModal(site, spinHistory, formatDate, onClose) {
  const modal = document.createElement('div');
  modal.className = 'modal-container';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  const title = document.createElement('h2');
  title.textContent = `Log Bonus - ${site}`;
  title.className = 'modal-title';
  modalContent.appendChild(title);

  const scrollView = document.createElement('div');
  scrollView.className = 'scroll-view';

  spinHistory?.forEach(spin => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p>Tipo: ${spin.result?.tipo || 'N/A'}</p>
      <p>Valore: ${spin.result?.valore || 'N/A'}</p>
      <p>Data: ${formatDate(spin.date)}</p>
    `;
    scrollView.appendChild(card);
  });

  modalContent.appendChild(scrollView);

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Chiudi';
  closeButton.className = 'close-button';
  closeButton.addEventListener('click', onClose);
  modalContent.appendChild(closeButton);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Cancella storia bonus';
  deleteButton.className = 'delete-button';
  modalContent.appendChild(deleteButton);

  modal.appendChild(modalContent);

  return modal;
}
