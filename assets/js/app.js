/**
 * Checklists Application Entry Point
 * Orchestrates storage, UI, service worker registration, and global shortcuts.
 */

import { loadData } from './storage.js';
import { UIController } from './ui.js';
import { isFirebaseConfigured } from '../../firebase-config.js';
import { t } from './i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Load initial persistent state
  const state = loadData();

  // 2. Initialize UI Controller
  const ui = new UIController(state);

  if (isFirebaseConfigured()) {
    try {
      const firebase = await import('./firebase.js');
      ui.setFirebase(firebase);
      firebase.observeAuth(
        (user) => {
          ui.handleAuthState(user).catch((error) => {
            console.error('Failed to initialize the signed-in account:', error);
            ui.updateSyncStatus(navigator.onLine ? 'error' : 'offline');
          });
        },
        (error) => {
          console.error('Firebase authentication state failed:', error);
          ui.updateSyncStatus(navigator.onLine ? 'error' : 'offline');
        }
      );
    } catch (error) {
      console.error('Firebase could not be initialized:', error);
      ui.setFirebaseUnavailable(isFirebaseConfigured() ? t('authNetworkError') : undefined);
    }
  } else {
    ui.setFirebaseUnavailable();
  }

  // 3. Register Progressive Web App Service Worker
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('[Checklists PWA] Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('[Checklists PWA] Service Worker registration failed:', error);
      });
  }

  // 4. Global keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    // Escape closes open modals or menus
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(modal => {
        modal.classList.remove('open');
      });
      document.querySelectorAll('.menu-dropdown.open').forEach(menu => {
        menu.classList.remove('open');
      });
    }

    // Ctrl+Z or Cmd+Z for Undo when not inside standard typing field
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.value !== '') {
        // Allow native text undo inside input if input is actively dirty
        return;
      }
      e.preventDefault();
      ui.undo();
    }
  });

  // Attach to window for debugging or manual testing if needed
  window.__checklistsUI = ui;
});
