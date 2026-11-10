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
    boardCounter: (count) => count === 1 ? '1 Board' : `${count} Boards`,
    noBoardsYet: 'No boards yet',
    noBoardsSub: 'Tap the button below to create your first board.',
    noPinnedBoards: 'No pinned boards',
    addYourTask: 'Add your task',
    newBoard: 'New Board',
    boardNameLabel: 'Board name',
    boardTitlePlaceholder: 'e.g. Goals for this year',
    create: 'Create',
    cancel: 'Cancel',
    save: 'Save',
    back: 'Back',
    delete: 'Delete',
    deleteSelected: 'Delete Selected',
    selectedCount: (n) => `${n} Selected`,
    undo: 'Undo',
    redo: 'Redo',
    pin: 'Pin Board',
    unpin: 'Unpin Board',
    deleteBoard: 'Delete Board',
    confirmDeleteBoard: 'Are you sure you want to delete this board? This cannot be undone.',
    confirmDeleteSelected: (n) => `Are you sure you want to delete ${n} selected board(s)?`,
    selectBoards: 'Select Boards',
    doneSelection: 'Done',
    sortBy: 'Sort By',
    sortDefault: 'Default (Date Edited)',
    sortDateEdited: 'Date Edited',
    sortDateCreated: 'Date Created',
    sortTitle: 'Title',
    sortNewestFirst: 'Newest First',
    sortOldestFirst: 'Oldest First',
    darkMode: 'Dark Mode',
    sectionTitlePlaceholder: 'Section name (e.g Wednesday)',
    addSection: 'Add Day / Section',
    newSectionPrompt: 'New Section / Day',
    addTaskPlaceholder: '', // Removed placeholder as requested
    addTask: 'Add Task',
    crossOutTask: 'Cross Out',
    uncrossTask: 'Restore Text',
    clearText: 'Clear Text',
    
    // Settings Modal
    settings: 'Settings',
    generalSettings: 'General Settings',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System Auto',
    language: 'Language',
    langEn: 'English',
    langDe: 'Deutsch',
    
    // Data Management
    dataManagement: 'Data Management',
    exportData: 'Export Data (JSON)',
    exportDesc: 'Download your boards as a JSON backup file.',
    importData: 'Import Data (JSON)',
    importDesc: 'Restore or merge boards from a JSON file.',
    importSuccess: 'Data imported successfully!',
    importInvalid: 'Invalid backup file format.',
    importReplaceOrMerge: 'How would you like to import this data?',
    importReplace: 'Replace All Data',
    importMerge: 'Merge with Existing',
    resetData: 'Delete Data',
    resetDesc: 'Factory reset of local storage.',
    confirmResetData: 'WARNING: Are you sure you want to delete ALL data? This will permanently erase all your boards and cannot be undone!',
    resetSuccess: 'All data has been deleted.',
    
    // Timestamps
    createdOn: (dateStr) => `Created ${dateStr}`,
    editedOn: (dateStr, timeStr) => `Edited ${dateStr} at ${timeStr}`,
    yesterday: 'Yesterday',
    today: 'Today',

    // Empty detail view state (desktop)
    selectBoardPrompt: 'Select a board from the sidebar or create a new one.'
  },
  de: {
    appName: 'Checklists',
    version: 'v1.0.0',
    appTitle: 'Checklists',
    allBoards: 'All Boards',
    pinnedBoards: 'Pinned',
    boardCounter: (count) => count === 1 ? '1 Board' : `${count} Boards`,
    noBoardsYet: 'Noch keine Boards vorhanden',
    noBoardsSub: 'Tippe auf den Button unten, um dein erstes Board zu erstellen.',
    noPinnedBoards: 'Keine angehefteten Boards',
    addYourTask: 'Add your task',
    newBoard: 'Neues Board',
    boardNameLabel: 'Board name',
    boardTitlePlaceholder: 'e.g. Goals for this year',
    create: 'Erstellen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    back: 'Zurück',
    delete: 'Löschen',
    deleteSelected: 'Ausgewählte löschen',
    selectedCount: (n) => `${n} ausgewählt`,
    undo: 'Rückgängig',
    redo: 'Wiederholen',
    pin: 'Board anheften',
    unpin: 'Board lösen',
    deleteBoard: 'Board löschen',
    confirmDeleteBoard: 'Möchtest du dieses Board wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.',
    confirmDeleteSelected: (n) => `Möchtest du ${n} ausgewählte(s) Board(s) wirklich löschen?`,
    selectBoards: 'Boards auswählen',
    doneSelection: 'Fertig',
    sortBy: 'Sortieren',
    sortDefault: 'Default (Date Edited)',
    sortDateEdited: 'Date Edited',
    sortDateCreated: 'Date Created',
    sortTitle: 'Title',
    sortNewestFirst: 'Newest First',
    sortOldestFirst: 'Oldest First',
    darkMode: 'Dunkelmodus',
    sectionTitlePlaceholder: 'Section name (e.g Wednesday)',
    addSection: 'Tag / Abschnitt hinzufügen',
    newSectionPrompt: 'Neuer Tag / Abschnitt',
    addTaskPlaceholder: '', // Removed placeholder
    addTask: 'Aufgabe hinzufügen',
    crossOutTask: 'Durchstreichen',
    uncrossTask: 'Wiederherstellen',
    clearText: 'Text löschen',
    
    // Settings Modal
    settings: 'Einstellungen',
    generalSettings: 'Allgemeine Einstellungen',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeSystem: 'Systemeinstellung',
    language: 'Sprache',
    langEn: 'English',
    langDe: 'Deutsch',
    
    // Data Management
    dataManagement: 'Datenverwaltung',
    exportData: 'Daten exportieren (JSON)',
    exportDesc: 'Lade deine Boards als JSON-Sicherungsdatei herunter.',
    importData: 'Daten importieren (JSON)',
    importDesc: 'Wiederherstellen oder Zusammenführen aus einer JSON-Datei.',
    importSuccess: 'Daten erfolgreich importiert!',
    importInvalid: 'Ungültiges Dateiformat.',
    importReplaceOrMerge: 'Wie sollen die Daten importiert werden?',
    importReplace: 'Alle Daten ersetzen',
    importMerge: 'Mit bestehenden Daten zusammenführen',
    resetData: 'Daten löschen',
    resetDesc: 'Vollständiges Zurücksetzen des lokalen Speichers.',
    confirmResetData: 'WARNUNG: Möchtest du wirklich ALLE lokalen Daten löschen? Alle Boards werden unwiderruflich gelöscht!',
    resetSuccess: 'Alle Daten wurden erfolgreich gelöscht.',
    
    // Timestamps
    createdOn: (dateStr) => `Created ${dateStr}`,
    editedOn: (dateStr, timeStr) => `Edited ${dateStr} at ${timeStr}`,
    yesterday: 'Gestern',
    today: 'Heute',

    // Empty detail view state (desktop)
    selectBoardPrompt: 'Wähle ein Board aus der Seitenleiste oder erstelle ein neues.'
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
