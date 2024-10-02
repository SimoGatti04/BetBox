import { createBalanceView, fetchAllRecentBalances } from './BalanceView/BalanceView.js';
import { createSpinView } from './SpinView/SpinView.js';
import { createActiveBetsView } from './ActiveBets/ActiveBetsView.js';
import { createLogView } from './ApiLogs/LogView.js';
import { createPredictionPreviewView } from './PredictionView/predictionPreviewView.js';

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
    const activeBetsLink = createNavLink('Scommesse', 'fa-ticket-alt', showActiveBetsView);
    const logLink = createNavLink('Log', 'fa-terminal', showLogView); // Aggiungiamo il link per i log
    const predictionLink = createNavLink('Predictions', 'fa-chart-line', showPredictionView);

    nav.appendChild(balanceLink);
    nav.appendChild(spinLink);
    nav.appendChild(activeBetsLink);
    nav.appendChild(logLink);
    nav.appendChild(predictionLink);

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

  const refreshAllButton = document.createElement('button');
  refreshAllButton.className = 'refresh-all-button';
  refreshAllButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
  refreshAllButton.addEventListener('click', fetchAllRecentBalances);

  const header = document.querySelector('header');
  header.appendChild(refreshAllButton);

  contentContainer.appendChild(createBalanceView());
}

function showSpinView() {
  updateHeaderTitle('Spin');
  const contentContainer = document.querySelector('main#content');
  contentContainer.innerHTML = '';
  contentContainer.appendChild(createSpinView());
}

function updateHeaderTitle(title) {
  const header = document.querySelector('header');
  if (header) {
    header.innerHTML = '';
    const h1 = document.createElement('h1');
    h1.textContent = title;
    header.appendChild(h1);
  }
}

function showActiveBetsView() {
    updateHeaderTitle('Bets');
    const contentContainer = document.querySelector('main#content');
    contentContainer.innerHTML = '';
    contentContainer.appendChild(createActiveBetsView());
}

function showLogView() {
    updateHeaderTitle('Log');
    const header = document.querySelector('header');
    const clearButton = document.createElement('button');
    clearButton.id = 'clearLogButton';
    clearButton.className = 'clear-log-button';
    clearButton.innerHTML = '<i class="fas fa-trash"></i>';
    header.appendChild(clearButton);

    const contentContainer = document.querySelector('main#content');
    contentContainer.innerHTML = '';
    contentContainer.appendChild(createLogView());

    clearButton.addEventListener('click', () => {
        localStorage.removeItem('apiLogs');
        contentContainer.innerHTML = '';
        contentContainer.appendChild(createLogView());
    });
}

function showPredictionView() {
    updateHeaderTitle('Predictions');
    const contentContainer = document.querySelector('main#content');
    contentContainer.innerHTML = '';
    contentContainer.appendChild(createPredictionPreviewView());
}

