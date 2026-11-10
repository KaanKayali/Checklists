/**
 * Storage Module for Checklists
 * Handles localStorage persistence, JSON export, and JSON import.
 */

const STORAGE_KEY = 'checklists_app_data_v1';

export function generateId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

export function getDefaultChecklists(lang = 'de') {
  const isDe = lang === 'de';
  const now = Date.now();
  const yesterday = now - 24 * 60 * 60 * 1000;
  const twoDaysAgo = now - 48 * 60 * 60 * 1000;

  return [
    {
      id: generateId('cl'),
      title: isDe ? 'Wochenplanung & Einkäufe' : 'Weekly Plan & Groceries',
      pinned: true,
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      sections: [
        {
          id: generateId('sec'),
          title: isDe ? 'Montag:' : 'Monday:',
          tasks: [
            { id: generateId('task'), text: isDe ? 'Bio-Hafermilch & Espresso-Bohnen' : 'Organic Oat Milk & Espresso Beans', completed: true, crossedOut: false },
            { id: generateId('task'), text: isDe ? 'Frisches Obst & Beeren für Frühstück' : 'Fresh berries & fruits for breakfast', completed: true, crossedOut: false },
            { id: generateId('task'), text: isDe ? 'Brot vom Bäcker holen' : 'Fresh sourdough bread', completed: false, crossedOut: false }
          ]
        },
        {
          id: generateId('sec'),
          title: isDe ? 'Mittwoch:' : 'Wednesday:',
          tasks: [
            { id: generateId('task'), text: isDe ? 'Zutaten für Pasta Pesto besorgen' : 'Ingredients for Pasta Pesto', completed: false, crossedOut: false },
            { id: generateId('task'), text: isDe ? 'Olivenöl & Parmesan' : 'Olive oil & Parmesan', completed: false, crossedOut: false }
          ]
        },
        {
          id: generateId('sec'),
          title: isDe ? 'Wochenende:' : 'Weekend:',
          tasks: [
            { id: generateId('task'), text: isDe ? 'Grillgemüse & Grillkäse' : 'Barbecue veggies & Halloumi', completed: false, crossedOut: false },
            { id: generateId('task'), text: isDe ? 'Kuchen für Sonntag vorbereiten' : 'Bake Sunday dessert cake', completed: false, crossedOut: false }
          ]
        }
      ]
    },
    {
      id: generateId('cl'),
      title: isDe ? 'Reisevorbereitung Urlaub' : 'Vacation Packing List',
      pinned: true,
      createdAt: twoDaysAgo + 3600000,
      updatedAt: now - 3600000,
      sections: [
        {
          id: generateId('sec'),
          title: isDe ? 'Wichtige Dokumente:' : 'Important Documents:',
          tasks: [
            { id: generateId('task'), text: isDe ? 'Reisepass & Personalausweis prüfen' : 'Check Passport & ID validity', completed: true, crossedOut: false },
            { id: generateId('task'), text: isDe ? 'Flugtickets & Hotelreservierung in Wallet' : 'Flight tickets & Hotel confirmation in Wallet', completed: true, crossedOut: false },
            { id: generateId('task'), text: isDe ? 'Auslandskrankenversicherung' : 'Travel insurance confirmation', completed: false, crossedOut: false }
          ]
        },
        {
          id: generateId('sec'),
          title: isDe ? 'Technik:' : 'Electronics:',
          tasks: [
            { id: generateId('task'), text: isDe ? 'Powerbank & USB-C Ladekabel' : 'Powerbank & USB-C charging cables', completed: false, crossedOut: false },
            { id: generateId('task'), text: isDe ? 'Kopfhörer (Noise Cancelling)' : 'Noise Cancelling Headphones', completed: false, crossedOut: false },
            { id: generateId('task'), text: isDe ? 'Reiseadapter für Steckdosen' : 'Travel adapter plug', completed: false, crossedOut: false }
          ]
        }
      ]
    },
    {
      id: generateId('cl'),
      title: isDe ? 'Projekt Roadmap v1.0.0' : 'Project Roadmap v1.0.0',
      pinned: false,
      createdAt: twoDaysAgo - 86400000,
      updatedAt: now - 1800000,
      sections: [
        {
          id: generateId('sec'),
          title: isDe ? 'Sprint 1:' : 'Sprint 1:',
          tasks: [
            { id: generateId('task'), text: isDe ? 'PWA Manifest & Service Worker registrieren' : 'PWA Manifest & Service Worker setup', completed: true, crossedOut: false },
            { id: generateId('task'), text: isDe ? 'Responsives Design für iPhone & Laptop testen' : 'Responsive test for iPhone & Desktop', completed: true, crossedOut: false },
            { id: generateId('task'), text: isDe ? 'Undo/Redo & Gesten-Unterstützung' : 'Undo/Redo & gesture support', completed: true, crossedOut: false }
          ]
        }
      ]
    }
  ];
}

export function getDefaultState() {
  const browserLang = (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('de')) ? 'de' : 'en';
  const defaultChecklists = getDefaultChecklists(browserLang);

  return {
    version: 1,
    settings: {
      language: browserLang,
      theme: 'light', // 'light' | 'dark' | 'system'
      fontSize: 'medium', // 'small' | 'medium' | 'large' | 'xlarge'
      sortBy: 'updatedAt_desc' // 'manual' | 'updatedAt_desc' | 'createdAt_desc' | 'title_asc'
    },
    activeChecklistId: defaultChecklists[0]?.id || null,
    scrollPositions: {
      overview: 0
    },
    checklists: defaultChecklists
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
    if (!parsed || !Array.isArray(parsed.checklists)) {
      const fallback = getDefaultState();
      saveData(fallback);
      return fallback;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to parse localStorage data:', err);
    return getDefaultState();
  }
}

export function saveData(data) {
  try {
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
    
    // Support either full backup wrapper or direct data state
    const payload = parsed.data || parsed;

    if (!payload || !Array.isArray(payload.checklists)) {
      throw new Error('Missing checklists array in JSON');
    }

    // Validate that each checklist has required fields
    for (const cl of payload.checklists) {
      if (!cl.id || !cl.title || !Array.isArray(cl.sections)) {
        throw new Error('Checklist item missing required fields');
      }
    }

    return payload;
  } catch (err) {
    console.error('Import validation failed:', err);
    return null;
  }
}

export function mergeImportData(existingState, importedPayload, replaceMode = false) {
  if (replaceMode) {
    return {
      ...existingState,
      settings: importedPayload.settings || existingState.settings,
      checklists: importedPayload.checklists,
      activeChecklistId: importedPayload.checklists[0]?.id || null,
      scrollPositions: importedPayload.scrollPositions || { overview: 0 }
    };
  }

  // Merge mode: append or update checklists
  const checklistMap = new Map();
  for (const cl of existingState.checklists) {
    checklistMap.set(cl.id, cl);
  }

  for (const cl of importedPayload.checklists) {
    // If id already exists, create a new ID to avoid overwriting or merge cleanly
    if (checklistMap.has(cl.id)) {
      const cloned = JSON.parse(JSON.stringify(cl));
      cloned.id = generateId('cl');
      cloned.title = `${cloned.title} (Imported)`;
      checklistMap.set(cloned.id, cloned);
    } else {
      checklistMap.set(cl.id, cl);
    }
  }

  return {
    ...existingState,
    checklists: Array.from(checklistMap.values())
  };
}

export function clearAllStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
