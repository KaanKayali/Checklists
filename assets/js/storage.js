/**
 * Storage Module for Checklists / Boards
 * Handles localStorage persistence, JSON export, and JSON import.
 */

const STORAGE_KEY = 'checklists_app_data_v1';

export function generateId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

export function getDefaultState() {
  const browserLang = (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('de')) ? 'de' : 'en';

  return {
    version: 1,
    settings: {
      language: browserLang,
      theme: 'light', // 'light' | 'dark' | 'system'
      sortBy: 'updatedAt', // 'default' | 'updatedAt' | 'createdAt' | 'title'
      sortOrder: 'desc', // 'desc' (Newest First) | 'asc' (Oldest First)
      pinnedCollapsed: false
    },
    activeBoardId: null,
    scrollPositions: {
      overview: 0
    },
    boards: [] // Clean initial state with ZERO sample data as requested
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultState();
      saveData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    
    // Support legacy "checklists" field migrating to "boards"
    if (parsed && !Array.isArray(parsed.boards) && Array.isArray(parsed.checklists)) {
      parsed.boards = parsed.checklists;
    }

    if (!parsed || !Array.isArray(parsed.boards)) {
      const fallback = getDefaultState();
      saveData(fallback);
      return fallback;
    }

    if (!parsed.settings) {
      parsed.settings = getDefaultState().settings;
    }

    // Support legacy sort field
    if (parsed.settings.sortBy === 'updatedAt_desc') {
      parsed.settings.sortBy = 'default';
      parsed.settings.sortOrder = 'desc';
    } else if (parsed.settings.sortBy === 'createdAt_desc') {
      parsed.settings.sortBy = 'createdAt';
      parsed.settings.sortOrder = 'desc';
    } else if (parsed.settings.sortBy === 'title_asc') {
      parsed.settings.sortBy = 'title';
      parsed.settings.sortOrder = 'asc';
    }

    if (!parsed.settings.sortOrder) {
      parsed.settings.sortOrder = 'desc';
    }

    // Support legacy activeChecklistId
    if (parsed.activeChecklistId && !parsed.activeBoardId) {
      parsed.activeBoardId = parsed.activeChecklistId;
    }

    return parsed;
  } catch (err) {
    console.error('Failed to parse localStorage data:', err);
    return getDefaultState();
  }
}

export function saveData(data) {
  try {
    data.checklists = data.boards;
    data.activeChecklistId = data.activeBoardId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save data to localStorage:', err);
  }
}

export function exportDataToFile(data) {
  const exportObject = {
    app: 'Checklists',
    exportVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    data: data
  };

  const jsonStr = JSON.stringify(exportObject, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = `checklists-backup-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportJSON(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    const payload = parsed.data || parsed;

    const boards = payload.boards || payload.checklists;
    if (!boards || !Array.isArray(boards)) {
      throw new Error('Missing boards array in JSON');
    }

    for (const b of boards) {
      if (!b.id || !b.title || !Array.isArray(b.sections)) {
        throw new Error('Board item missing required fields');
      }
    }

    payload.boards = boards;
    return payload;
  } catch (err) {
    console.error('Import validation failed:', err);
    return null;
  }
}

export function mergeImportData(existingState, importedPayload, replaceMode = false) {
  const importedBoards = importedPayload.boards || importedPayload.checklists || [];

  if (replaceMode) {
    return {
      ...existingState,
      settings: importedPayload.settings || existingState.settings,
      boards: importedBoards,
      activeBoardId: importedBoards[0]?.id || null,
      scrollPositions: importedPayload.scrollPositions || { overview: 0 }
    };
  }

  const boardMap = new Map();
  for (const b of existingState.boards) {
    boardMap.set(b.id, b);
  }

  for (const b of importedBoards) {
    if (boardMap.has(b.id)) {
      const cloned = JSON.parse(JSON.stringify(b));
      cloned.id = generateId('b');
      cloned.title = `${cloned.title} (Imported)`;
      boardMap.set(cloned.id, cloned);
    } else {
      boardMap.set(b.id, b);
    }
  }

  return {
    ...existingState,
    boards: Array.from(boardMap.values())
  };
}

export function clearAllStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
