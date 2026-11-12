/**
 * Internationalization (i18n) Module for Checklists
 * English (en) and German (de)
 * All checklist items are termed "Boards".
 */

export const translations = {
  en: {
    appName: 'Checklists',
    version: 'v1.0.0',
    appTitle: 'Checklists',
    allBoards: 'All Boards',
    pinnedBoards: 'Pinned',
    menuLabel: 'Open menu',
    pinnedToggleLabel: 'Show or hide pinned boards',
    newBoardLabel: 'New board',
    backLabel: 'Back',
    undoLabel: 'Undo (Ctrl+Z)',
    boardMenuLabel: 'Board menu',
    addSectionLabel: 'Add section',
    crossOutLabel: 'Cross out task',
    clearTextLabel: 'Clear task text',
    addTaskLabel: 'Add task',
    completeTaskLabel: 'Mark task complete',
    reopenTaskLabel: 'Mark task incomplete',
    boardCounter: (count) => count === 1 ? '1 Board' : `${count} Boards`,
    noBoardsYet: 'No boards yet',
    noBoardsSub: 'Create a board to get started',
    noPinnedBoards: 'No pinned boards',
    addYourTask: 'Add a task',
    newBoard: 'New board',
    boardNameLabel: 'Board name',
    boardTitlePlaceholder: 'e.g. Yearly goals',
    sectionNameLabel: 'Section name',
    create: 'Create',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    back: 'Back',
    delete: 'Delete',
    deleteSelected: 'Delete selected',
    selectedCount: (n) => `${n} selected`,
    undo: 'Undo',
    redo: 'Redo',
    pin: 'Pin board',
    unpin: 'Unpin board',
    deleteBoard: 'Delete board',
    confirmDeleteBoard: 'Delete this board? This can’t be undone.',
    confirmDeleteSelected: (n) => `Delete ${n} selected board${n === 1 ? '' : 's'}?`,
    selectBoards: 'Select boards',
    doneSelection: 'Done',
    sortBy: 'Sort by',
    sortDefault: 'Recently edited',
    sortDateEdited: 'Date edited',
    sortDateCreated: 'Date created',
    sortTitle: 'Name',
    sortNewestFirst: 'Newest first',
    sortOldestFirst: 'Oldest first',
    darkMode: 'Dark mode',
    sectionTitlePlaceholder: 'e.g. Wednesday',
    addSection: 'Add section',
    newSectionPrompt: 'New section',
    addTaskPlaceholder: '', // Removed placeholder as requested
    addTask: 'Add task',
    crossOutTask: 'Crossed out',
    uncrossTask: 'Restored',
    clearText: 'Text cleared',
    
    // Settings Modal
    settings: 'Settings',
    generalSettings: 'Settings',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    darkModeOn: 'Dark mode on',
    darkModeOff: 'Dark mode off',
    language: 'Language',
    langEn: 'English',
    langDe: 'Deutsch',
    
    // Data Management
    dataManagement: 'Your data',
    exportData: 'Export JSON',
    exportDesc: 'Save a JSON backup of your boards',
    importData: 'Import JSON',
    importDesc: 'Restore or merge a JSON backup',
    importSuccess: 'Import complete',
    exportSuccess: 'Backup downloaded',
    importInvalid: 'Choose a valid JSON backup',
    importReplaceOrMerge: 'Choose how to import',
    importReplace: 'Replace data',
    importMerge: 'Merge data',
    boardCreated: 'Board created',
    boardPinned: 'Board pinned',
    boardUnpinned: 'Board unpinned',
    boardDeleted: 'Board deleted',
    boardsDeleted: 'Boards deleted',
    taskDeleted: 'Task deleted',
    resetData: 'Delete all data',
    resetDesc: 'Permanently remove all boards',
    confirmResetData: 'Delete all boards and settings? This can’t be undone.',
    resetSuccess: 'All data deleted',
    
    // Timestamps
    createdOn: (dateStr) => `Created ${dateStr}`,
    editedOn: (dateStr, timeStr) => `Edited ${dateStr} at ${timeStr}`,
    yesterday: 'Yesterday',
    today: 'Today',

    // Empty detail view state (desktop)
    selectBoardPrompt: 'Choose a board or create one'
  },
  de: {
    appName: 'Checklists',
    version: 'v1.0.0',
    appTitle: 'Checklists',
    allBoards: 'Alle Boards',
    pinnedBoards: 'Angeheftet',
    menuLabel: 'Menü öffnen',
    pinnedToggleLabel: 'Angeheftete Boards ein- oder ausblenden',
    newBoardLabel: 'Neues Board',
    backLabel: 'Zurück',
    undoLabel: 'Rückgängig (Strg+Z)',
    boardMenuLabel: 'Board-Menü',
    addSectionLabel: 'Abschnitt hinzufügen',
    crossOutLabel: 'Aufgabe durchstreichen',
    clearTextLabel: 'Aufgabentext löschen',
    addTaskLabel: 'Aufgabe hinzufügen',
    completeTaskLabel: 'Aufgabe erledigen',
    reopenTaskLabel: 'Aufgabe wieder öffnen',
    boardCounter: (count) => count === 1 ? '1 Board' : `${count} Boards`,
    noBoardsYet: 'Noch keine Boards',
    noBoardsSub: 'Erstelle dein erstes Board',
    noPinnedBoards: 'Keine angehefteten Boards',
    addYourTask: 'Aufgabe hinzufügen',
    newBoard: 'Neues Board',
    boardNameLabel: 'Boardname',
    boardTitlePlaceholder: 'z. B. Jahresziele',
    sectionNameLabel: 'Abschnittsname',
    create: 'Erstellen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    close: 'Schließen',
    back: 'Zurück',
    delete: 'Löschen',
    deleteSelected: 'Auswahl löschen',
    selectedCount: (n) => `${n} ausgewählt`,
    undo: 'Rückgängig',
    redo: 'Wiederholen',
    pin: 'Board anheften',
    unpin: 'Anheftung lösen',
    deleteBoard: 'Board löschen',
    confirmDeleteBoard: 'Board löschen? Das lässt sich nicht rückgängig machen.',
    confirmDeleteSelected: (n) => `${n} ${n === 1 ? 'ausgewähltes Board' : 'ausgewählte Boards'} löschen?`,
    selectBoards: 'Boards auswählen',
    doneSelection: 'Fertig',
    sortBy: 'Sortieren nach',
    sortDefault: 'Zuletzt bearbeitet',
    sortDateEdited: 'Änderungsdatum',
    sortDateCreated: 'Erstellungsdatum',
    sortTitle: 'Name',
    sortNewestFirst: 'Neueste zuerst',
    sortOldestFirst: 'Älteste zuerst',
    darkMode: 'Dunkelmodus',
    sectionTitlePlaceholder: 'z. B. Mittwoch',
    addSection: 'Abschnitt hinzufügen',
    newSectionPrompt: 'Neuer Abschnitt',
    addTaskPlaceholder: '', // Removed placeholder
    addTask: 'Aufgabe hinzufügen',
    crossOutTask: 'Durchgestrichen',
    uncrossTask: 'Wiederhergestellt',
    clearText: 'Text gelöscht',
    
    // Settings Modal
    settings: 'Einstellungen',
    generalSettings: 'Einstellungen',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeSystem: 'System',
    darkModeOn: 'Dunkelmodus an',
    darkModeOff: 'Dunkelmodus aus',
    language: 'Sprache',
    langEn: 'English',
    langDe: 'Deutsch',
    
    // Data Management
    dataManagement: 'Deine Daten',
    exportData: 'JSON exportieren',
    exportDesc: 'Boards als JSON sichern',
    importData: 'JSON importieren',
    importDesc: 'JSON-Sicherung wiederherstellen oder zusammenführen',
    importSuccess: 'Import abgeschlossen',
    exportSuccess: 'Sicherung heruntergeladen',
    importInvalid: 'Gültige JSON-Sicherung auswählen',
    importReplaceOrMerge: 'Importart auswählen',
    importReplace: 'Daten ersetzen',
    importMerge: 'Daten zusammenführen',
    boardCreated: 'Board erstellt',
    boardPinned: 'Board angeheftet',
    boardUnpinned: 'Board gelöst',
    boardDeleted: 'Board gelöscht',
    boardsDeleted: 'Boards gelöscht',
    taskDeleted: 'Aufgabe gelöscht',
    resetData: 'Alle Daten löschen',
    resetDesc: 'Alle Boards dauerhaft löschen',
    confirmResetData: 'Alle Boards und Einstellungen löschen? Das lässt sich nicht rückgängig machen.',
    resetSuccess: 'Alle Daten gelöscht',
    
    // Timestamps
    createdOn: (dateStr) => `Erstellt: ${dateStr}`,
    editedOn: (dateStr, timeStr) => `Bearbeitet: ${dateStr} um ${timeStr}`,
    yesterday: 'Gestern',
    today: 'Heute',

    // Empty detail view state (desktop)
    selectBoardPrompt: 'Board auswählen oder neues erstellen'
  }
};

let currentLanguage = 'en';

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    return true;
  }
  return false;
}

export function t(key, ...args) {
  const dict = translations[currentLanguage] || translations.en;
  const val = dict[key];
  if (typeof val === 'function') {
    return val(...args);
  }
  if (val !== undefined) {
    return val;
  }
  const fallback = translations.en[key];
  if (typeof fallback === 'function') return fallback(...args);
  return fallback !== undefined ? fallback : key;
}

export function formatFullDate(timestamp) {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const lang = currentLanguage === 'de' ? 'de-DE' : 'en-US';
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat(lang, options).format(date);
}

export function formatTime(timestamp) {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatBoardTimestamp(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    return formatTime(timestamp);
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return t('yesterday');
  }

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}
