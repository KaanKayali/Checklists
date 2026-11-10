/**
 * Internationalization (i18n) Module for Checklists
 * English (en) and German (de)
 */

export const translations = {
  en: {
    appName: 'Checklists',
    version: 'v1.0.0',
    appTitle: 'Checklists v1.0.0',
    allChecklists: 'All Checklists',
    pinnedChecklists: 'Pinned Checklists',
    checklistCounter: (count) => count === 1 ? '1 Checklist' : `${count} Checklists`,
    tasksCount: (done, total) => `${done}/${total} done`,
    noChecklistsYet: 'No checklists yet',
    noChecklistsSub: 'Tap the + button to create your first checklist.',
    noPinnedChecklists: 'No pinned checklists',
    noTasksInSection: 'No tasks in this section. Type below to add one.',
    newChecklist: 'New Checklist',
    checklistTitlePlaceholder: 'Checklist name...',
    create: 'Create',
    cancel: 'Cancel',
    save: 'Save',
    back: 'Back',
    delete: 'Delete',
    undo: 'Undo',
    redo: 'Redo',
    pin: 'Pin Checklist',
    unpin: 'Unpin Checklist',
    rename: 'Rename Checklist',
    duplicate: 'Duplicate Checklist',
    clearCompleted: 'Clear Completed Tasks',
    deleteChecklist: 'Delete Checklist',
    confirmDeleteChecklist: 'Are you sure you want to delete this checklist? This cannot be undone.',
    sectionTitlePlaceholder: 'Section name (e.g. Wednesday, Weekend)...',
    addSection: 'Add Day / Section',
    newSectionPrompt: 'New Section / Day',
    addTaskPlaceholder: 'Add a new task...',
    addTask: 'Add Task',
    crossOutTask: 'Cross Out',
    uncrossTask: 'Restore Text',
    clearText: 'Clear Text',
    cursorNotice: 'Editing at cursor position',
    
    // Settings
    settings: 'Settings',
    generalSettings: 'General Settings',
    sorting: 'Sort Checklists By',
    sortDefault: 'Manual / Default Order',
    sortUpdated: 'Date Edited (Most Recent)',
    sortCreated: 'Date Created',
    sortTitle: 'Alphabetical (A - Z)',
    darkMode: 'Dark Mode',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System Auto',
    fontSize: 'Font Size in Checklist',
    fontSizeSmall: 'Small',
    fontSizeMedium: 'Medium',
    fontSizeLarge: 'Large',
    fontSizeXLarge: 'Extra Large',
    language: 'Language',
    langEn: 'English',
    langDe: 'Deutsch (German)',
    
    // Data Management
    dataManagement: 'Data Management',
    exportData: 'Export Data (JSON)',
    exportDesc: 'Download your checklists as a JSON backup file.',
    importData: 'Import Data (JSON)',
    importDesc: 'Restore or merge checklists from a JSON file.',
    importSuccess: 'Data imported successfully!',
    importInvalid: 'Invalid backup file format.',
    importReplaceOrMerge: 'How would you like to import this data?',
    importReplace: 'Replace All Data',
    importMerge: 'Merge with Existing',
    resetData: 'Delete All Data',
    resetDesc: 'Factory reset of local storage.',
    confirmResetData: 'WARNING: Are you sure you want to delete ALL data? This will permanently erase all your checklists and cannot be undone!',
    resetSuccess: 'All data has been deleted.',
    
    // Timestamps
    createdOn: (dateStr) => `Created ${dateStr}`,
    editedOn: (dateStr, timeStr) => `Edited ${dateStr} at ${timeStr}`,
    editedRelative: (rel) => `edited ${rel}`,
    justNow: 'Just now',
    yesterday: 'Yesterday',
    today: 'Today',
    daysAgo: (days) => `${days} days ago`,

    // Empty detail view state (desktop)
    selectChecklistPrompt: 'Select a checklist from the sidebar or create a new one.',
    
    // Swipe action
    swipeToDelete: 'Swipe left to delete'
  },
  de: {
    appName: 'Checklists',
    version: 'v1.0.0',
    appTitle: 'Checklists v1.0.0',
    allChecklists: 'Alle Checklisten',
    pinnedChecklists: 'Angeheftete Checklisten',
    checklistCounter: (count) => count === 1 ? '1 Checkliste' : `${count} Checklisten`,
    tasksCount: (done, total) => `${done}/${total} erledigt`,
    noChecklistsYet: 'Noch keine Checklisten vorhanden',
    noChecklistsSub: 'Tippe auf den Stift-Button, um deine erste Checkliste zu erstellen.',
    noPinnedChecklists: 'Keine angehefteten Checklisten',
    noTasksInSection: 'Keine Aufgaben in diesem Abschnitt. Unten tippen, um eine hinzuzufügen.',
    newChecklist: 'Neue Checkliste',
    checklistTitlePlaceholder: 'Name der Checkliste...',
    create: 'Erstellen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    back: 'Zurück',
    delete: 'Löschen',
    undo: 'Rückgängig',
    redo: 'Wiederholen',
    pin: 'Checkliste anheften',
    unpin: 'Anheftung lösen',
    rename: 'Checkliste umbenennen',
    duplicate: 'Checkliste duplizieren',
    clearCompleted: 'Erledigte Aufgaben bereinigen',
    deleteChecklist: 'Checkliste löschen',
    confirmDeleteChecklist: 'Möchtest du diese Checkliste wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.',
    sectionTitlePlaceholder: 'Abschnittsname (z.B. Mittwoch:, Wochenende:)...',
    addSection: 'Tag / Abschnitt hinzufügen',
    newSectionPrompt: 'Neuer Tag / Abschnitt',
    addTaskPlaceholder: 'Neue Aufgabe hinzufügen...',
    addTask: 'Aufgabe hinzufügen',
    crossOutTask: 'Durchstreichen',
    uncrossTask: 'Wiederherstellen',
    clearText: 'Text löschen',
    cursorNotice: 'Aktion an Cursor-Position',
    
    // Settings
    settings: 'Einstellungen',
    generalSettings: 'Allgemeine Einstellungen',
    sorting: 'Checklisten sortieren nach',
    sortDefault: 'Standard / Manuell',
    sortUpdated: 'Zuletzt bearbeitet',
    sortCreated: 'Erstellungsdatum',
    sortTitle: 'Alphabetisch (A - Z)',
    darkMode: 'Dunkelmodus',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeSystem: 'Systemeinstellung',
    fontSize: 'Schriftgröße in Checkliste',
    fontSizeSmall: 'Klein',
    fontSizeMedium: 'Mittel',
    fontSizeLarge: 'Groß',
    fontSizeXLarge: 'Sehr groß',
    language: 'Sprache',
    langEn: 'English',
    langDe: 'Deutsch',
    
    // Data Management
    dataManagement: 'Datenverwaltung',
    exportData: 'Daten exportieren (JSON)',
    exportDesc: 'Lade deine Checklisten als JSON-Sicherungsdatei herunter.',
    importData: 'Daten importieren (JSON)',
    importDesc: 'Wiederherstellen oder Zusammenführen aus einer JSON-Datei.',
    importSuccess: 'Daten erfolgreich importiert!',
    importInvalid: 'Ungültiges Dateiformat.',
    importReplaceOrMerge: 'Wie sollen die Daten importiert werden?',
    importReplace: 'Alle Daten ersetzen',
    importMerge: 'Mit bestehenden Daten zusammenführen',
    resetData: 'Alle Daten löschen',
    resetDesc: 'Vollständiges Zurücksetzen des lokalen Speichers.',
    confirmResetData: 'WARNUNG: Möchtest du wirklich ALLE lokalen Daten löschen? Alle Checklisten werden unwiderruflich gelöscht!',
    resetSuccess: 'Alle Daten wurden erfolgreich gelöscht.',
    
    // Timestamps
    createdOn: (dateStr) => `Erstellt am ${dateStr}`,
    editedOn: (dateStr, timeStr) => `Bearbeitet am ${dateStr} um ${timeStr}`,
    editedRelative: (rel) => `bearbeitet ${rel}`,
    justNow: 'Gerade eben',
    yesterday: 'Gestern',
    today: 'Heute',
    daysAgo: (days) => `vor ${days} Tagen`,

    // Empty detail view state (desktop)
    selectChecklistPrompt: 'Wähle eine Checkliste aus der Seitenleiste oder erstelle eine neue.',

    // Swipe action
    swipeToDelete: 'Nach links wischen zum Löschen'
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
  // Fallback to English
  const fallback = translations.en[key];
  if (typeof fallback === 'function') return fallback(...args);
  return fallback !== undefined ? fallback : key;
}

/**
 * Format date nicely according to current language
 */
export function formatFullDate(timestamp) {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const lang = currentLanguage === 'de' ? 'de-DE' : 'en-US';
  
  // Format day, month name, year
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

export function formatRelativeDate(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 2) {
    return t('justNow');
  }

  // Check if today
  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    return `${t('today')} ${formatTime(timestamp)}`;
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return `${t('yesterday')} ${formatTime(timestamp)}`;
  }

  if (diffDay < 7) {
    return t('daysAgo', diffDay);
  }

  return formatFullDate(timestamp);
}
