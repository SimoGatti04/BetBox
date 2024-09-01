import { createBalanceView } from './BalanceView.js';
import { createSpinView } from './SpinView.js';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  const nav = createNavigation();
  root.appendChild(nav);

  const contentContainer = document.createElement('div');
  contentContainer.id = 'content';
  root.appendChild(contentContainer);

  showBalanceView(); // Mostra la vista dei saldi all'avvio
});

function createNavigation() {
  const nav = document.createElement('nav');
  const balanceLink = createNavLink('Saldi', 'fa-wallet', showBalanceView);
  const spinLink = createNavLink('Spin', 'fa-sync', showSpinView);
  nav.appendChild(balanceLink);
  nav.appendChild(spinLink);
  return nav;
}

function createNavLink(text, iconClass, onClick) {
  const link = document.createElement('a');
  const icon = document.createElement('i');
  icon.className = `fas ${iconClass}`;
  link.appendChild(icon);
  link.href = '#';
  link.addEventListener('click', (e) => {
    e.preventDefault();
    onClick();
  });
  return link;
}


function showBalanceView() {
  updateHeaderTitle('Saldi');
  const contentContainer = document.querySelector('main#content');
  contentContainer.innerHTML = '';
  contentContainer.appendChild(createBalanceView());
}

function showSpinView() {
  updateHeaderTitle('Spin');
  const contentContainer = document.querySelector('main#content');
  contentContainer.innerHTML = '';
  contentContainer.appendChild(createSpinView());
}


function updateHeaderTitle(title) {
  const header = document.querySelector('header h1');
  if (header) {
    header.textContent = title;
  }
}
