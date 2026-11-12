/**
 * UI Controller for Checklists Web Application
 * Handles DOM rendering, selection mode, sort submenus, cursor tracking, gestures, undo stack, and interactions.
 */

import { t, getLanguage, setLanguage, formatFullDate, formatTime, formatBoardTimestamp } from './i18n.js';
import { generateId, saveData, exportDataToFile, parseImportJSON, mergeImportData, clearAllStorage, getDefaultState } from './storage.js';

export class UIController {
  constructor(state) {
    this.state = state;
    if (!this.state.boards) {
      this.state.boards = this.state.checklists || [];
    }
    this.activeTaskId = null; // Currently focused task ID for cursor logic
    this.activeSectionId = null;
    this.undoStack = [];
    this.maxUndoStack = 30;

    // Selection mode state
    this.isSelectionMode = false;
    this.selectedBoardIds = new Set();

    // Cache DOM Elements
    this.appEl = document.getElementById('app');
    this.viewContainer = document.getElementById('viewContainer');
    this.masterView = document.getElementById('masterView');
    this.detailView = document.getElementById('detailView');

    // Header elements
    this.brandTitleEl = document.getElementById('brandTitle');
    this.boardCounterEl = document.getElementById('boardCounter');
    this.btnMainMenu = document.getElementById('btnMainMenu');
    this.mainMenuDropdown = document.getElementById('mainMenuDropdown');
    this.mainMenuRoot = document.getElementById('mainMenuRoot');
    this.sortSubmenu = document.getElementById('sortSubmenu');
    this.menuSortSubtitle = document.getElementById('menuSortSubtitle');
    this.sortSubmenuSubtitle = document.getElementById('sortSubmenuSubtitle');
    this.darkModeIcon = document.getElementById('darkModeIcon');

    // Selection action bar elements
    this.selectionActionBar = document.getElementById('selectionActionBar');
    this.btnDeleteSelected = document.getElementById('btnDeleteSelected');
    this.deleteSelectedText = document.getElementById('deleteSelectedText');
    this.btnCancelSelection = document.getElementById('btnCancelSelection');

    // Master View lists
    this.pinnedSectionContainer = document.getElementById('pinnedSectionContainer');
    this.btnTogglePinned = document.getElementById('btnTogglePinned');
    this.pinnedContainer = document.getElementById('pinnedContainer');
    this.allContainer = document.getElementById('allContainer');
    this.fabContainer = document.getElementById('fabContainer');
    this.btnFab = document.getElementById('btnFab');

    // Detail View elements
    this.btnBack = document.getElementById('btnBack');
    this.detailTitleInput = document.getElementById('detailTitleInput');
    this.metaCreated = document.getElementById('metaCreated');
    this.metaEdited = document.getElementById('metaEdited');
    this.btnUndo = document.getElementById('btnUndo');
    this.btnDetailMenu = document.getElementById('btnDetailMenu');
    this.detailMenuDropdown = document.getElementById('detailMenuDropdown');
    this.pinMenuLabel = document.getElementById('pinMenuLabel');
    this.pinMenuIcon = document.getElementById('pinMenuIcon');
    this.detailContent = document.getElementById('detailContent');
    this.sectionsContainer = document.getElementById('sectionsContainer');
    this.detailToolbar = document.getElementById('detailToolbar');

    // Detail Toolbar buttons
    this.btnAddTask = document.getElementById('btnAddTask');
    this.btnAddSection = document.getElementById('btnAddSection');
    this.btnCrossOut = document.getElementById('btnCrossOut');
    this.btnEditTask = document.getElementById('btnEditTask');
    this.selectedTaskId = null;
    this.selectedTaskSectionId = null;
    this.editingTaskId = null;

    // Modals
    this.settingsModal = document.getElementById('settingsModal');
    this.newBoardModal = document.getElementById('newBoardModal');
    this.newSectionModal = document.getElementById('newSectionModal');
    this.confirmModal = document.getElementById('confirmModal');
    this.toastEl = document.getElementById('toast');

    this.init();
  }

  init() {
    this.applyTheme(this.state.settings.theme);
    setLanguage(this.state.settings.language);
    this.cleanUpEmptyTasks();

    this.bindEvents();
    this.renderOverview();

    // Restore active board
    if (this.state.activeBoardId) {
      const activeBoard = this.getBoard(this.state.activeBoardId);
      if (activeBoard) {
        this.openBoard(activeBoard.id, false);
      } else if (this.state.boards.length > 0) {
        this.openBoard(this.state.boards[0].id, false);
      }
    } else if (window.innerWidth >= 860 && this.state.boards.length > 0) {
      this.openBoard(this.state.boards[0].id, false);
    }

    this.restoreScrollPositions();
    this.updateStaticTranslations();
    this.updateSortUI();
  }

  // --- State Persistence & Undo ---

  pushUndoState() {
    const activeBoard = this.getActiveBoard();
    if (!activeBoard) return;
    const snapshot = JSON.parse(JSON.stringify(activeBoard));
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxUndoStack) {
      this.undoStack.shift();
    }
    this.updateUndoButtonState();
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const previousSnapshot = this.undoStack.pop();
    const index = this.state.boards.findIndex(b => b.id === previousSnapshot.id);
    if (index !== -1) {
      this.state.boards[index] = previousSnapshot;
      this.save();
      this.renderOverview();
      this.renderDetail();
      this.showToast(t('undo'));
    }
    this.updateUndoButtonState();
  }

  updateUndoButtonState() {
    if (this.btnUndo) {
      this.btnUndo.disabled = this.undoStack.length === 0;
    }
  }

  save() {
    saveData(this.state);
  }

  getActiveBoard() {
    return this.state.boards.find(b => b.id === this.state.activeBoardId);
  }

  getBoard(id) {
    return this.state.boards.find(b => b.id === id);
  }

  // --- Scroll Restoration ---
  saveScrollPosition() {
    if (!this.state.scrollPositions) {
      this.state.scrollPositions = {};
    }
    if (this.masterView) {
      const mc = this.masterView.querySelector('.master-content');
      if (mc) this.state.scrollPositions.overview = mc.scrollTop;
    }
    if (this.state.activeBoardId && this.detailContent) {
      this.state.scrollPositions[`b_${this.state.activeBoardId}`] = this.detailContent.scrollTop;
    }
    this.save();
  }

  restoreScrollPositions() {
    if (!this.state.scrollPositions) return;

    if (this.masterView) {
      const mc = this.masterView.querySelector('.master-content');
      if (mc && this.state.scrollPositions.overview !== undefined) {
        mc.scrollTop = this.state.scrollPositions.overview;
      }
    }

    if (this.state.activeBoardId && this.detailContent) {
      const savedY = this.state.scrollPositions[`b_${this.state.activeBoardId}`];
      if (savedY !== undefined) {
        this.detailContent.scrollTop = savedY;
      }
    }
  }

  // --- Theme & Appearance ---
  applyTheme(theme) {
    this.state.settings.theme = theme;
    let effective = theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effective = prefersDark ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effective);
    
    const themeBg = effective === 'dark' ? '#1a202c' : '#f8f9fb';
    document.documentElement.style.backgroundColor = themeBg;
    document.body.style.backgroundColor = themeBg;
    document.documentElement.style.colorScheme = effective;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', themeBg);
    }
    const statusBarStyle = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarStyle) {
      statusBarStyle.setAttribute('content', effective === 'dark' ? 'black-translucent' : 'default');
    }
    this.save();
  }

  toggleThemeDirectly() {
    const current = this.state.settings.theme || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    this.showToast(next === 'dark' ? t('darkModeOn') : t('darkModeOff'));
  }

  // --- Sorting & Submenu Handling ---
  getSortedBoards(boards) {
    const list = [...boards];
    const sortBy = this.state.settings.sortBy || 'default';
    const sortOrder = this.state.settings.sortOrder || 'desc';
    const mult = sortOrder === 'asc' ? 1 : -1;

    if (sortBy === 'default' || sortBy === 'updatedAt') {
      return list.sort((a, b) => mult * ((a.updatedAt || 0) - (b.updatedAt || 0)));
    }
    if (sortBy === 'createdAt') {
      return list.sort((a, b) => mult * ((a.createdAt || 0) - (b.createdAt || 0)));
    }
    if (sortBy === 'title') {
      return list.sort((a, b) => mult * (a.title || '').localeCompare(b.title || ''));
    }
    return list;
  }

  setSortCriteria(criteria) {
    this.state.settings.sortBy = criteria;
    this.save();
    this.updateSortUI();
    this.renderOverview();
  }

  setSortOrder(order) {
    this.state.settings.sortOrder = order;
    this.save();
    this.updateSortUI();
    this.renderOverview();
  }

  getSortLabel() {
    const sortBy = this.state.settings.sortBy || 'default';
    if (sortBy === 'default') return t('sortDefault');
    if (sortBy === 'updatedAt') return t('sortDateEdited');
    if (sortBy === 'createdAt') return t('sortDateCreated');
    if (sortBy === 'title') return t('sortTitle');
    return t('sortDefault');
  }

  updateSortUI() {
    const label = this.getSortLabel();
    if (this.menuSortSubtitle) this.menuSortSubtitle.textContent = label;
    if (this.sortSubmenuSubtitle) this.sortSubmenuSubtitle.textContent = label;

    const currentSort = this.state.settings.sortBy || 'default';
    const currentOrder = this.state.settings.sortOrder || 'desc';

    document.querySelectorAll('.sort-option-item[data-sort]').forEach(el => {
      const s = el.getAttribute('data-sort');
      el.classList.toggle('selected', s === currentSort);
    });

    document.querySelectorAll('.sort-option-item[data-order]').forEach(el => {
      const o = el.getAttribute('data-order');
      el.classList.toggle('selected', o === currentOrder);
    });
  }

  openSortSubmenu() {
    if (this.mainMenuRoot) this.mainMenuRoot.style.display = 'none';
    if (this.sortSubmenu) this.sortSubmenu.style.display = 'flex';
  }

  closeSortSubmenu() {
    if (this.sortSubmenu) this.sortSubmenu.style.display = 'none';
    if (this.mainMenuRoot) this.mainMenuRoot.style.display = 'block';
  }

  // --- Selection Mode Logic ---
  startSelectionMode() {
    this.isSelectionMode = true;
    this.selectedBoardIds.clear();

    if (this.masterView) this.masterView.classList.add('selection-mode');
    if (this.btnMainMenu) this.btnMainMenu.style.display = 'none';
    if (this.selectionActionBar) this.selectionActionBar.style.display = 'flex';
    if (this.fabContainer) this.fabContainer.style.display = 'none';

    this.updateSelectionActionBar();
    this.renderOverview();
  }

  endSelectionMode() {
    this.isSelectionMode = false;
    this.selectedBoardIds.clear();

    if (this.masterView) this.masterView.classList.remove('selection-mode');
    if (this.btnMainMenu) this.btnMainMenu.style.display = 'inline-flex';
    if (this.selectionActionBar) this.selectionActionBar.style.display = 'none';
    if (this.fabContainer) this.fabContainer.style.display = 'block';

    this.renderOverview();
  }

  toggleBoardSelection(id) {
    if (this.selectedBoardIds.has(id)) {
      this.selectedBoardIds.delete(id);
    } else {
      this.selectedBoardIds.add(id);
    }
    this.updateSelectionActionBar();
    this.renderOverview();
  }

  updateSelectionActionBar() {
    const count = this.selectedBoardIds.size;
    if (this.deleteSelectedText) {
      this.deleteSelectedText.textContent = `(${count})`;
    }
    if (this.btnDeleteSelected) {
      this.btnDeleteSelected.disabled = count === 0;
    }
  }

  confirmDeleteSelectedBoards() {
    const count = this.selectedBoardIds.size;
    if (count === 0) return;

    this.showConfirmDialog(
      t('deleteSelected'),
      t('confirmDeleteSelected', count),
      t('delete'),
      () => {
        this.state.boards = this.state.boards.filter(b => !this.selectedBoardIds.has(b.id));
        if (this.selectedBoardIds.has(this.state.activeBoardId)) {
          this.state.activeBoardId = this.state.boards[0]?.id || null;
        }
        this.save();
        this.endSelectionMode();
        this.showToast(t('boardsDeleted'));
      }
    );
  }

  // --- View Switching ---
  openBoard(id, pushHistory = true) {
    this.saveScrollPosition();
    if (this.detailContent) this.detailContent.style.paddingBottom = '';
    this.clearTaskSelection();
    this.state.activeBoardId = id;
    this.activeTaskId = null;
    this.undoStack = [];
    this.updateUndoButtonState();
    this.save();

    this.renderOverview();
    this.renderDetail();

    if (window.innerWidth < 860) {
      this.viewContainer.classList.add('detail-active');
    }

    setTimeout(() => {
      if (this.detailContent && this.state.scrollPositions) {
        const savedY = this.state.scrollPositions[`b_${id}`];
        if (savedY !== undefined) {
          this.detailContent.scrollTop = savedY;
        } else {
          this.detailContent.scrollTop = 0;
        }
      }
    }, 50);
  }

  closeDetail() {
    this.clearTaskSelection();
    this.cleanUpEmptyTasks();
    this.saveScrollPosition();
    this.viewContainer.classList.remove('detail-active');
    this.state.activeBoardId = null;
    this.activeTaskId = null;
    this.save();
    this.renderOverview();
  }

  // --- Automatic Cleanup of Empty Tasks ---
  cleanUpEmptyTasks() {
    let modified = false;
    for (const board of this.state.boards || []) {
      for (const section of board.sections || []) {
        if (section.tasks) {
          const originalCount = section.tasks.length;
          section.tasks = section.tasks.filter(task => typeof task.text === 'string' && task.text.trim() !== '');
          if (section.tasks.length !== originalCount) {
            modified = true;
          }
        }
      }
    }

    if (modified) {
      this.save();
    }
  }

  // --- Rendering Overview (Master View) ---
  renderOverview() {
    const all = this.getSortedBoards(this.state.boards || []);
    const pinned = all.filter(b => b.pinned);
    const unpinned = all.filter(b => !b.pinned);

    if (this.boardCounterEl) {
      this.boardCounterEl.textContent = t('boardCounter', all.length);
    }

    // Render Pinned Boards
    if (this.pinnedSectionContainer && this.pinnedContainer) {
      if (pinned.length > 0) {
        this.pinnedSectionContainer.style.display = 'block';
        this.pinnedContainer.innerHTML = pinned.map(b => this.createBoardRowHTML(b)).join('');
        
        const isCollapsed = !!this.state.settings.pinnedCollapsed;
        if (isCollapsed) {
          this.pinnedContainer.classList.add('collapsed');
          this.btnTogglePinned?.classList.add('collapsed');
        } else {
          this.pinnedContainer.classList.remove('collapsed');
          this.btnTogglePinned?.classList.remove('collapsed');
        }
      } else {
        this.pinnedSectionContainer.style.display = 'none';
        this.pinnedContainer.innerHTML = '';
      }
    }

    // Render All / Unpinned Boards
    if (this.allContainer) {
      if (unpinned.length === 0 && pinned.length === 0) {
        this.allContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
            </div>
            <div class="empty-state-title">${t('noBoardsYet')}</div>
            <div class="empty-state-sub">${t('noBoardsSub')}</div>
          </div>
        `;
      } else {
        this.allContainer.innerHTML = unpinned.map(b => this.createBoardRowHTML(b)).join('');
      }
    }

    // Bind click events on board rows
    const rows = this.masterView.querySelectorAll('.board-row');
    rows.forEach(row => {
      row.addEventListener('click', (e) => {
        const id = row.getAttribute('data-id');
        if (this.isSelectionMode) {
          this.toggleBoardSelection(id);
        } else {
          this.openBoard(id);
        }
      });
    });
  }

  createBoardRowHTML(board) {
    const isActive = board.id === this.state.activeBoardId;
    const isSelected = this.selectedBoardIds.has(board.id);
    
    let previewText = '';
    if (board.sections) {
      for (const sec of board.sections) {
        if (sec.tasks && sec.tasks.length > 0) {
          const firstTask = sec.tasks.find(t => t.text && t.text.trim() !== '');
          if (firstTask) {
            previewText = firstTask.text;
            break;
          }
        }
        if (!previewText && sec.title && sec.title.trim() !== '') {
          previewText = sec.title;
        }
      }
    }

    const timestampStr = formatBoardTimestamp(board.updatedAt || board.createdAt);

    return `
      <div class="board-row ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}" data-id="${board.id}">
        <!-- Selection checkbox for selection mode -->
        <div class="board-select-checkbox">
          <svg viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>

        <div class="board-row-content">
          <div class="board-row-title">${this.escapeHTML(board.title || t('newBoard'))}</div>
          <div class="board-row-meta">
            <span class="board-timestamp">${this.escapeHTML(timestampStr)}</span>
            ${previewText ? `<span class="board-preview-text">${this.escapeHTML(previewText)}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // --- Rendering Detail View ---
  renderDetail() {
    const board = this.getActiveBoard();
    if (!board) {
      if (this.detailContent) this.detailContent.style.paddingBottom = '';
      this.clearTaskSelection();
      if (this.detailTitleInput) this.detailTitleInput.value = '';
      if (this.metaCreated) this.metaCreated.textContent = '';
      if (this.metaEdited) this.metaEdited.textContent = '';
      if (this.sectionsContainer) {
        this.sectionsContainer.innerHTML = `
          <div class="empty-state" style="padding-top: 100px;">
            <div class="empty-state-title">${t('appName')}</div>
            <div class="empty-state-sub">${t('selectBoardPrompt')}</div>
          </div>
        `;
      }
      return;
    }

    if (this.detailTitleInput) {
      this.detailTitleInput.value = board.title || '';
    }

    // Stacked Timestamps untereinander
    if (this.metaCreated) {
      const createdStr = formatFullDate(board.createdAt || Date.now());
      this.metaCreated.textContent = t('createdOn', createdStr);
    }
    if (this.metaEdited) {
      const editedDateStr = formatFullDate(board.updatedAt || Date.now());
      const editedTimeStr = formatTime(board.updatedAt || Date.now());
      this.metaEdited.textContent = t('editedOn', editedDateStr, editedTimeStr);
    }

    // Pin/Unpin menu item label and icon
    if (this.pinMenuLabel) {
      this.pinMenuLabel.textContent = board.pinned ? t('unpin') : t('pin');
    }
    if (this.pinMenuIcon) {
      if (board.pinned) {
        this.pinMenuIcon.innerHTML = `<path d="M16 9V4l1 0V2H7v2l1 0v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z M2 2l20 20-1.41 1.41L13.8 16.6l-.8.8v6l-1 1-1-1v-6.97L5 14v-2c.6-.6 1.1-1.3 1.3-2.1L2 2z"/>`;
      } else {
        this.pinMenuIcon.innerHTML = `<path d="M16 9V4l1 0V2H7v2l1 0v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>`;
      }
    }

    // Render Sections and tasks
    if (this.sectionsContainer) {
      const hasSections = board.sections && board.sections.length > 0;
      const totalTasks = hasSections ? board.sections.reduce((acc, s) => acc + (s.tasks ? s.tasks.length : 0), 0) : 0;

      if (!hasSections || totalTasks === 0) {
        // Completely empty state showing "Add your task"
        this.sectionsContainer.innerHTML = `
          <div class="empty-state" style="padding-top: 80px;">
            <div class="empty-state-title" style="color: var(--text-muted); font-size: 1.25rem;">${t('addYourTask')}</div>
          </div>
        `;
      } else {
        this.sectionsContainer.innerHTML = board.sections.map((section) => `
          <div class="task-section" data-section-id="${section.id}">
            <div class="task-section-header">
              <button type="button" class="section-drag-handle" data-section-id="${section.id}" aria-label="${t('moveSectionLabel')}" title="${t('moveSectionLabel')}">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M9 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10-14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
                </svg>
              </button>
              <input type="text" 
                     class="section-title-input" 
                     value="${this.escapeHTML(section.title || '')}" 
                     placeholder="${t('sectionTitlePlaceholder')}"
                     data-section-id="${section.id}">
              ${board.sections.length > 1 ? `
                <button class="btn-section-delete" data-section-id="${section.id}" title="${t('delete')}" aria-label="${t('delete')}">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              ` : ''}
            </div>
            <div class="tasks-container" data-section-id="${section.id}">
              ${(section.tasks && section.tasks.length > 0) ? section.tasks.map(task => this.createTaskItemHTML(task, section.id)).join('') : ''}
            </div>
          </div>
        `).join('');

        this.bindTaskSectionEvents();
      }
    }

    if (this.selectedTaskId) {
      const selectedSection = board.sections?.find(section => section.id === this.selectedTaskSectionId);
      if (selectedSection?.tasks?.some(task => task.id === this.selectedTaskId)) {
        this.selectTask(this.selectedTaskSectionId, this.selectedTaskId);
      } else {
        this.clearTaskSelection();
      }
    }

    this.updateUndoButtonState();
  }

  createTaskItemHTML(task, sectionId) {
    const isCompleted = !!task.completed;
    const isCrossed = !!task.crossedOut;

    return `
      <div class="task-item ${isCompleted ? 'completed' : ''} ${isCrossed ? 'crossed-out' : ''}" 
           data-task-id="${task.id}" 
           data-section-id="${sectionId}">
        
        <!-- Swipe Delete Action Underneath for Mobile -->
        <button type="button" class="task-swipe-action" data-task-id="${task.id}" data-section-id="${sectionId}" aria-label="${t('delete')}" aria-hidden="true" tabindex="-1">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>

        <div class="task-content-wrapper">
          <div class="custom-checkbox" data-task-id="${task.id}" data-section-id="${sectionId}" title="${t(task.completed ? 'reopenTaskLabel' : 'completeTaskLabel')}" aria-label="${t(task.completed ? 'reopenTaskLabel' : 'completeTaskLabel')}" role="checkbox" aria-checked="${isCompleted}" tabindex="0">
            <svg viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>

          <!-- Auto-resizing textarea with NO manual resize handle and NO placeholder -->
          <textarea class="task-input" ${window.innerWidth < 860 && this.editingTaskId !== task.id ? 'readonly' : ''}
                    rows="1"
                    data-task-id="${task.id}" 
                    data-section-id="${sectionId}">${this.escapeHTML(task.text || '')}</textarea>

          <!-- Desktop Delete Button (visible only on large screens on hover) -->
          <button class="btn-task-delete-desktop" data-task-id="${task.id}" data-section-id="${sectionId}" title="${t('delete')}" aria-label="${t('delete')}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  // --- Task & Section Event Binding ---
  bindTaskSectionEvents() {
    if (!this.sectionsContainer) return;

    // Checkbox toggling
    const checkboxes = this.sectionsContainer.querySelectorAll('.custom-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = cb.getAttribute('data-task-id');
        const sectionId = cb.getAttribute('data-section-id');
        this.toggleTaskCompleted(sectionId, taskId);
      });
      cb.addEventListener('keydown', (e) => {
        if (e.key !== ' ' && e.key !== 'Enter') return;
        e.preventDefault();
        const taskId = cb.getAttribute('data-task-id');
        const sectionId = cb.getAttribute('data-section-id');
        this.toggleTaskCompleted(sectionId, taskId);
      });
    });

    // Section title change
    const sectionInputs = this.sectionsContainer.querySelectorAll('.section-title-input');
    sectionInputs.forEach(input => {
      input.addEventListener('focus', () => { this.activeSectionId = input.dataset.sectionId; this.activeTaskId = null; });
      input.addEventListener('input', () => {
        const secId = input.getAttribute('data-section-id');
        const board = this.getActiveBoard();
        if (board && board.sections) {
          const sec = board.sections.find(s => s.id === secId);
          if (sec) {
            sec.title = input.value;
            board.updatedAt = Date.now();
            this.save();
          }
        }
      });
    });

    // Delete Section
    const deleteSectionBtns = this.sectionsContainer.querySelectorAll('.btn-section-delete');
    deleteSectionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const secId = btn.getAttribute('data-section-id');
        const board = this.getActiveBoard();
        const section = board?.sections?.find(item => item.id === secId);
        this.showConfirmDialog(t('delete'), t('confirmDeleteSection', section?.title || ''), t('delete'), () => this.deleteSection(secId));
      });
    });

    // Task text textarea events
    const taskInputs = this.sectionsContainer.querySelectorAll('.task-input');
    taskInputs.forEach(input => {
      const taskId = input.getAttribute('data-task-id');
      const sectionId = input.getAttribute('data-section-id');

      const autoResize = () => {
        input.style.height = 'auto';
        input.style.height = `${input.scrollHeight}px`;
      };
      autoResize();

      // Focus: track the active task.
      input.addEventListener('focus', () => {
        this.activeTaskId = taskId;
        this.activeSectionId = sectionId;
        this.selectTask(sectionId, taskId);
      });

      input.addEventListener('pointerdown', (event) => {
        if (window.innerWidth < 860 && input.readOnly) event.preventDefault();
      });

      input.addEventListener('blur', () => {
        if (input.value.trim() === '') {
          if (this.editingTaskId === taskId) this.editingTaskId = null;
          if (this.selectedTaskId === taskId) this.clearTaskSelection();
          this.deleteTask(sectionId, taskId, false);
        }
      });

      // Text input change
      input.addEventListener('input', () => {
        autoResize();
        const board = this.getActiveBoard();
        if (board && board.sections) {
          const sec = board.sections.find(s => s.id === sectionId);
          if (sec && sec.tasks) {
            const task = sec.tasks.find(t => t.id === taskId);
            if (task) {
              task.text = input.value;
              board.updatedAt = Date.now();
              this.save();
            }
          }
        }
      });

      // Enter finishes editing; the selected task remains available to toolbar actions.
      input.addEventListener('keydown', (e) => {
        if (window.innerWidth >= 860 && e.key === 'Backspace' && input.value.trim() === '') {
          e.preventDefault();
          this.deleteTaskAndFocusPrev(sectionId, taskId);
        }
      });
    });

    this.sectionsContainer.querySelectorAll('.task-content-wrapper').forEach(wrapper => {
      wrapper.addEventListener('click', () => {
        if (window.innerWidth < 860 && !wrapper.closest('.task-item').classList.contains('delete-revealed')) {
          const item = wrapper.closest('.task-item');
          this.selectTask(item.dataset.sectionId, item.dataset.taskId);
        }
      });
    });

    // Desktop delete button click
    const deleteBtns = this.sectionsContainer.querySelectorAll('.btn-task-delete-desktop');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task-id');
        const sectionId = btn.getAttribute('data-section-id');
        this.deleteTask(sectionId, taskId);
      });
    });

    this.sectionsContainer.querySelectorAll('.task-swipe-action').forEach(button => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const { taskId, sectionId } = button.dataset;
        this.deleteTask(sectionId, taskId);
        this.showToast(t('taskDeleted'));
      });
    });

    this.bindSwipeGestures();
    if (!this.sectionsContainer.dataset.selectionBound) {
      this.sectionsContainer.dataset.selectionBound = 'true';
      document.addEventListener('pointerdown', event => {
        if (!event.target.closest('.task-item') && !event.target.closest('.detail-toolbar')) this.clearTaskSelection();
      });
    }
  }

  selectTask(sectionId, taskId) {
    if (this.editingTaskId && this.editingTaskId !== taskId) {
      const editingInput = this.sectionsContainer?.querySelector(`.task-input[data-task-id="${this.editingTaskId}"]`);
      if (editingInput) {
        editingInput.readOnly = true;
        editingInput.blur();
      }
      this.editingTaskId = null;
      this.btnEditTask?.setAttribute('aria-label', t('editTaskLabel'));
      if (this.btnEditTask) this.btnEditTask.title = t('editTaskLabel');
    }
    this.selectedTaskId = taskId;
    this.selectedTaskSectionId = sectionId;
    this.activeTaskId = taskId;
    this.activeSectionId = sectionId;
    this.sectionsContainer?.querySelectorAll('.task-item').forEach(item => item.classList.toggle('task-selected', item.dataset.taskId === taskId));
    [this.btnCrossOut, this.btnEditTask].forEach(button => { if (button) button.disabled = !taskId; });
  }

  clearTaskSelection() {
    const editingInput = this.editingTaskId && this.sectionsContainer?.querySelector(`.task-input[data-task-id="${this.editingTaskId}"]`);
    if (editingInput) {
      editingInput.readOnly = true;
      editingInput.blur();
    }
    this.editingTaskId = null;
    this.selectedTaskId = null;
    this.selectedTaskSectionId = null;
    this.activeTaskId = null;
    this.activeSectionId = null;
    this.sectionsContainer?.querySelectorAll('.task-item').forEach(item => item.classList.remove('task-selected'));
    [this.btnCrossOut, this.btnEditTask].forEach(button => { if (button) button.disabled = true; });
    this.btnEditTask?.setAttribute('aria-label', t('editTaskLabel'));
    if (this.btnEditTask) this.btnEditTask.title = t('editTaskLabel');
  }

  editSelectedTask() {
    if (window.innerWidth >= 860 || !this.selectedTaskId) return;
    if (this.editingTaskId === this.selectedTaskId) {
      const input = this.sectionsContainer?.querySelector(`.task-input[data-task-id="${this.selectedTaskId}"]`);
      if (input) {
        input.readOnly = true;
        input.blur();
      }
      this.editingTaskId = null;
      this.btnEditTask?.setAttribute('aria-label', t('editTaskLabel'));
      if (this.btnEditTask) this.btnEditTask.title = t('editTaskLabel');
      return;
    }

    this.editingTaskId = this.selectedTaskId;
    const input = this.sectionsContainer?.querySelector(`.task-input[data-task-id="${this.editingTaskId}"]`);
    if (input) {
      input.readOnly = false;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
    this.btnEditTask?.setAttribute('aria-label', t('finishEditingTaskLabel'));
    if (this.btnEditTask) this.btnEditTask.title = t('finishEditingTaskLabel');
  }

  // --- Task Operations ---
  toggleTaskCompleted(sectionId, taskId) {
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board || !board.sections) return;
    const sec = board.sections.find(s => s.id === sectionId);
    if (!sec || !sec.tasks) return;
    const task = sec.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    board.updatedAt = Date.now();
    this.save();
    this.clearTaskSelection();
    this.renderOverview();
    this.renderDetail();
  }

  crossOutActiveTask() {
    if (!this.selectedTaskId) return;
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board || !board.sections) return;

    let targetTask = null;

    if (this.selectedTaskId) {
      for (const sec of board.sections) {
        if (sec.tasks) {
          const found = sec.tasks.find(t => t.id === this.selectedTaskId);
          if (found) {
            targetTask = found;
            break;
          }
        }
      }
    }

    if (targetTask) {
      targetTask.crossedOut = !targetTask.crossedOut;
      board.updatedAt = Date.now();
      this.save();
      this.renderDetail();
      this.showToast(targetTask.crossedOut ? t('crossOutTask') : t('uncrossTask'));
    }
  }

  insertTaskBelow(sectionId, currentTaskId) {
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board || !board.sections) return;
    const sec = board.sections.find(s => s.id === sectionId);
    if (!sec) return;
    if (!sec.tasks) sec.tasks = [];

    const newTask = {
      id: generateId('task'),
      text: '',
      completed: false,
      crossedOut: false
    };

    const curIndex = sec.tasks.findIndex(t => t.id === currentTaskId);
    if (curIndex !== -1) {
      sec.tasks.splice(curIndex + 1, 0, newTask);
    } else {
      sec.tasks.push(newTask);
    }

    board.updatedAt = Date.now();
    this.activeTaskId = newTask.id;
    this.activeSectionId = sec.id;
    this.selectedTaskId = newTask.id;
    this.selectedTaskSectionId = sec.id;
    if (window.innerWidth < 860) this.editingTaskId = newTask.id;
    this.save();
    this.renderDetail();
    this.focusAndCenterTask(newTask.id);
  }

  focusAndCenterTask(taskId) {
    const input = this.sectionsContainer?.querySelector(`.task-input[data-task-id="${taskId}"]`);
    const content = this.detailContent;
    if (!input || !content) return;

    input.focus();
    requestAnimationFrame(() => {
      if (!input.isConnected) return;
      const currentPadding = Number.parseFloat(getComputedStyle(content).paddingBottom) || 0;
      content.style.paddingBottom = `${Math.max(currentPadding, content.clientHeight / 2)}px`;
      input.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });
  }

  addTaskAtCursorOrBottom() {
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board) return;

    // If no sections exist yet, automatically generate one with placeholder Section name (e.g Wednesday)
    if (!board.sections || board.sections.length === 0) {
      board.sections = [{
        id: generateId('sec'),
        title: '',
        tasks: []
      }];
    }

    const focusedSectionId = document.activeElement?.closest('.task-section')?.dataset.sectionId;
    const selectedSectionId = this.sectionsContainer?.querySelector('.task-section.section-selected')?.dataset.sectionId;
    const targetSectionId = this.selectedTaskId
      ? this.selectedTaskSectionId
      : (selectedSectionId || this.activeSectionId || focusedSectionId);
    const targetSection = board.sections.find(section => section.id === targetSectionId) || board.sections[board.sections.length - 1];
    if (!targetSection.tasks) targetSection.tasks = [];

    const newTask = {
      id: generateId('task'),
      text: '',
      completed: false,
      crossedOut: false
    };

    if (this.selectedTaskId) {
      const curIndex = targetSection.tasks.findIndex(task => task.id === this.selectedTaskId);
      if (curIndex !== -1) {
        targetSection.tasks.splice(curIndex + 1, 0, newTask);
      } else {
        targetSection.tasks.push(newTask);
      }
    } else {
      targetSection.tasks.push(newTask);
    }

    board.updatedAt = Date.now();
    this.activeTaskId = newTask.id;
    this.activeSectionId = targetSection.id;
    this.selectedTaskId = newTask.id;
    this.selectedTaskSectionId = targetSection.id;
    if (window.innerWidth < 860) this.editingTaskId = newTask.id;
    this.save();
    this.renderDetail();

    this.focusAndCenterTask(newTask.id);
  }

  deleteTask(sectionId, taskId, pushHistory = true) {
    if (pushHistory) this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board || !board.sections) return;
    const sec = board.sections.find(s => s.id === sectionId);
    if (!sec || !sec.tasks) return;

    if (this.selectedTaskId === taskId) this.clearTaskSelection();
    if (this.editingTaskId === taskId) this.editingTaskId = null;
    sec.tasks = sec.tasks.filter(t => t.id !== taskId);
    if (this.activeTaskId === taskId) {
      this.activeTaskId = null;
    }
    board.updatedAt = Date.now();
    this.save();
    this.renderDetail();
  }

  deleteTaskAndFocusPrev(sectionId, taskId) {
    const board = this.getActiveBoard();
    if (!board || !board.sections) return;
    const sec = board.sections.find(s => s.id === sectionId);
    if (!sec || !sec.tasks) return;

    const curIndex = sec.tasks.findIndex(t => t.id === taskId);
    const prevTask = curIndex > 0 ? sec.tasks[curIndex - 1] : null;

    this.deleteTask(sectionId, taskId);

    if (prevTask) {
      setTimeout(() => {
        const input = this.sectionsContainer.querySelector(`.task-input[data-task-id="${prevTask.id}"]`);
        if (input) {
          input.focus();
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
      }, 50);
    }
  }

  addSection(title) {
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board) return;
    if (!board.sections) board.sections = [];

    const newSec = {
      id: generateId('sec'),
      title: title || '',
      tasks: [{ id: generateId('task'), text: '', completed: false, crossedOut: false }]
    };

    board.sections.push(newSec);
    board.updatedAt = Date.now();
    this.activeTaskId = newSec.tasks[0].id;
    this.activeSectionId = newSec.id;
    this.selectedTaskId = newSec.tasks[0].id;
    this.selectedTaskSectionId = newSec.id;
    if (window.innerWidth < 860) this.editingTaskId = newSec.tasks[0].id;
    this.save();
    this.renderDetail();
    this.focusAndCenterTask(newSec.tasks[0].id);
  }

  deleteSection(sectionId) {
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board || !board.sections || board.sections.length <= 1) return;

    board.sections = board.sections.filter(s => s.id !== sectionId);
    if (this.activeSectionId === sectionId) this.activeSectionId = board.sections[0]?.id || null;
    board.updatedAt = Date.now();
    this.save();
    this.renderOverview();
    this.renderDetail();
  }

  // --- Mobile Touch Gestures: Swipe-to-Delete ---
  bindSwipeGestures() {
    const clearHoldTimer = state => {
      if (state.holdTimer) clearTimeout(state.holdTimer);
      state.holdTimer = null;
    };

    this.sectionsContainer.querySelectorAll('.task-item').forEach(item => {
      const wrapper = item.querySelector('.task-content-wrapper');
      const swipeAction = item.querySelector('.task-swipe-action');
      const taskId = item.dataset.taskId;
      const sectionId = item.dataset.sectionId;
      const state = { startX: 0, startY: 0, isSwiping: false, holdTimer: null, wasDeleteRevealed: false };

      item.draggable = true;
      item.addEventListener('dragstart', event => {
        event.dataTransfer.setData('application/x-checklists-task', JSON.stringify({ taskId, sectionId }));
        event.dataTransfer.effectAllowed = 'move';
        const rect = item.getBoundingClientRect();
        event.dataTransfer.setDragImage(item, Math.min(event.clientX - rect.left, rect.width), Math.min(event.clientY - rect.top, rect.height));
        this.beginReorderDrag('task', item);
      });
      item.addEventListener('dragend', () => {
        if (this.reorderDrag?.source === item) {
          this.finishReorderDrag(!!this.reorderDrag.dropped);
        }
      });

      item.addEventListener('touchstart', event => {
        if (event.target.closest('button')) return;
        const touch = event.touches[0];
        state.startX = touch.clientX;
        state.startY = touch.clientY;
        state.wasDeleteRevealed = item.classList.contains('delete-revealed');
        state.isSwiping = false;
        wrapper.style.transition = 'none';
        state.holdTimer = setTimeout(() => {
          this.beginReorderDrag('task', item, { x: state.startX, y: state.startY });
          if (navigator.vibrate) navigator.vibrate(25);
        }, 420);
      }, { passive: true });

      item.addEventListener('touchmove', event => {
        const touch = event.touches[0];
        if (this.reorderDrag?.source === item) {
          event.preventDefault();
          this.updateReorderDrag(touch.clientX, touch.clientY);
          return;
        }
        if (state.holdTimer && (Math.abs(touch.clientX - state.startX) > 12 || Math.abs(touch.clientY - state.startY) > 12)) {
          clearHoldTimer(state);
        }
        const diffX = touch.clientX - state.startX;
        const diffY = touch.clientY - state.startY;
        if (Math.abs(diffX) > Math.abs(diffY) && (diffX < 0 || (state.wasDeleteRevealed && diffX > 0))) {
          state.isSwiping = true;
          const startOffset = state.wasDeleteRevealed ? -80 : 0;
          const translateX = Math.min(0, Math.max(-100, startOffset + diffX));
          wrapper.style.transform = `translateX(${translateX}px)`;
        }
      }, { passive: false });

      item.addEventListener('touchend', event => {
        clearHoldTimer(state);
        if (this.reorderDrag?.source === item) {
          this.finishReorderDrag(true);
          return;
        }
        if (!state.isSwiping) {
          wrapper.style.transition = '';
          return;
        }
        wrapper.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        const diffX = event.changedTouches[0].clientX - state.startX;
        if (diffX < -70) {
          item.classList.add('delete-revealed');
          swipeAction.removeAttribute('aria-hidden');
          swipeAction.tabIndex = 0;
        } else if (state.wasDeleteRevealed && diffX > 40) {
          item.classList.remove('delete-revealed');
          swipeAction.setAttribute('aria-hidden', 'true');
          swipeAction.tabIndex = -1;
        }
        wrapper.style.transform = '';
      });

      item.addEventListener('touchcancel', () => {
        clearHoldTimer(state);
        if (this.reorderDrag?.source === item) this.finishReorderDrag(false);
        wrapper.style.transition = '';
        wrapper.style.transform = '';
      });
    });

    this.sectionsContainer.querySelectorAll('.task-section').forEach(section => {
      section.addEventListener('click', event => {
        if (event.target.closest('button, .task-item')) return;
        this.activeSectionId = section.dataset.sectionId;
        this.activeTaskId = null;
        this.sectionsContainer.querySelectorAll('.task-section').forEach(el => el.classList.toggle('section-selected', el === section));
      });

      const handle = section.querySelector('.section-drag-handle');
      if (!handle) return;
      handle.draggable = true;
      handle.addEventListener('dragstart', event => {
        event.dataTransfer.setData('application/x-section', section.dataset.sectionId);
        event.dataTransfer.effectAllowed = 'move';
        const rect = section.getBoundingClientRect();
        event.dataTransfer.setDragImage(section, Math.min(event.clientX - rect.left, rect.width), Math.min(event.clientY - rect.top, rect.height));
        this.beginReorderDrag('section', section);
      });
      handle.addEventListener('dragend', () => {
        if (this.reorderDrag?.source === section) {
          this.finishReorderDrag(!!this.reorderDrag.dropped);
        }
      });

      const state = { startX: 0, startY: 0, holdTimer: null };
      handle.addEventListener('touchstart', event => {
        const touch = event.touches[0];
        state.startX = touch.clientX;
        state.startY = touch.clientY;
        state.holdTimer = setTimeout(() => {
          this.beginReorderDrag('section', section, { x: state.startX, y: state.startY });
          if (navigator.vibrate) navigator.vibrate(25);
        }, 420);
      }, { passive: true });
      handle.addEventListener('touchmove', event => {
        const touch = event.touches[0];
        if (this.reorderDrag?.source === section) {
          event.preventDefault();
          this.updateReorderDrag(touch.clientX, touch.clientY);
        } else if (state.holdTimer && (Math.abs(touch.clientX - state.startX) > 12 || Math.abs(touch.clientY - state.startY) > 12)) {
          clearHoldTimer(state);
        }
      }, { passive: false });
      handle.addEventListener('touchend', () => {
        clearHoldTimer(state);
        if (this.reorderDrag?.source === section) this.finishReorderDrag(true);
      });
      handle.addEventListener('touchcancel', () => {
        clearHoldTimer(state);
        if (this.reorderDrag?.source === section) this.finishReorderDrag(false);
      });
    });

    if (!this.sectionsContainer.dataset.reorderBound) {
      this.sectionsContainer.dataset.reorderBound = 'true';
      this.sectionsContainer.addEventListener('dragover', event => {
        if (!this.reorderDrag || this.reorderDrag.touch) return;
        event.preventDefault();
        this.updateReorderDrag(event.clientX, event.clientY);
      });
      this.sectionsContainer.addEventListener('drop', event => {
        if (!this.reorderDrag) return;
        event.preventDefault();
        this.reorderDrag.dropped = true;
        this.finishReorderDrag(true);
      });
    }
  }

  beginReorderDrag(kind, source, point = null) {
    if (this.reorderDrag) this.finishReorderDrag(false);

    const rect = source.getBoundingClientRect();
    const placeholder = document.createElement('div');
    placeholder.className = `${kind === 'task' ? 'task-item' : 'task-section'} reorder-placeholder reorder-placeholder-${kind}`;
    placeholder.style.height = `${rect.height}px`;
    placeholder.style.width = `${rect.width}px`;
    placeholder.setAttribute('aria-hidden', 'true');
    source.parentElement.insertBefore(placeholder, source);
    source.classList.add('reorder-source');

    let preview = null;
    if (point) {
      preview = source.cloneNode(true);
      preview.classList.remove('reorder-source', 'dragging', 'drag-target', 'task-selected');
      preview.classList.add('reorder-preview');
      preview.style.width = `${rect.width}px`;
      preview.style.height = `${rect.height}px`;
      preview.style.left = `${point.x - rect.width / 2}px`;
      preview.style.top = `${point.y - Math.min(point.y - rect.top, rect.height / 2)}px`;
      document.body.appendChild(preview);
      source.style.display = 'none';
    } else {
      source.style.display = 'none';
    }

    this.reorderDrag = {
      kind,
      source,
      placeholder,
      preview,
      touch: !!point,
      dropped: false,
      sourceId: kind === 'task' ? source.dataset.taskId : source.dataset.sectionId,
      sourceSectionId: source.dataset.sectionId
    };
    if (point) this.updateReorderDrag(point.x, point.y);
  }

  updateReorderDrag(x, y) {
    const drag = this.reorderDrag;
    if (!drag) return;
    if (drag.preview) {
      drag.preview.style.left = `${x - drag.preview.offsetWidth / 2}px`;
      drag.preview.style.top = `${y - drag.preview.offsetHeight / 2}px`;
    }

    if (drag.kind === 'task') {
      const target = document.elementFromPoint(x, y);
      const taskItems = [...this.sectionsContainer.querySelectorAll('.task-item:not(.reorder-source):not(.reorder-placeholder)')];
      const targetTask = target?.closest('.task-item:not(.reorder-source)') ||
        taskItems.find(task => {
          const rect = task.getBoundingClientRect();
          return y >= rect.top && y <= rect.bottom;
        });
      const sections = [...this.sectionsContainer.querySelectorAll('.task-section:not(.reorder-source):not(.reorder-placeholder)')];
      const targetSection = target?.closest('.task-section:not(.reorder-source)') ||
        sections.find(section => {
          const rect = section.getBoundingClientRect();
          return y >= rect.top && y <= rect.bottom;
        }) ||
        sections.find(section => y < section.getBoundingClientRect().top + section.getBoundingClientRect().height / 2) ||
        sections[sections.length - 1];
      const tasksContainer = targetTask?.parentElement ||
        target?.closest('.tasks-container') ||
        targetSection?.querySelector('.tasks-container');
      if (!tasksContainer || !this.sectionsContainer.contains(tasksContainer)) return;

      const tasks = [...tasksContainer.children].filter(element =>
        element.classList.contains('task-item') &&
        !element.classList.contains('reorder-source') &&
        !element.classList.contains('reorder-placeholder')
      );
      const beforeTask = tasks.find(task =>
        y < task.getBoundingClientRect().top + task.getBoundingClientRect().height / 2
      ) || null;
      tasksContainer.insertBefore(drag.placeholder, beforeTask);
      drag.placeholder.dataset.sectionId = tasksContainer.dataset.sectionId;
      return;
    }

    const targetSection = document.elementFromPoint(x, y)?.closest('.task-section:not(.reorder-source)');
    const sections = [...this.sectionsContainer.children].filter(element =>
      element.classList.contains('task-section') &&
      !element.classList.contains('reorder-source') &&
      !element.classList.contains('reorder-placeholder')
    );
    let beforeSection = null;
    if (targetSection && sections.includes(targetSection)) {
      const rect = targetSection.getBoundingClientRect();
      beforeSection = y < rect.top + rect.height / 2 ? targetSection : targetSection.nextElementSibling;
    } else {
      beforeSection = sections.find(section => y < section.getBoundingClientRect().top + section.getBoundingClientRect().height / 2) || null;
    }
    this.sectionsContainer.insertBefore(drag.placeholder, beforeSection);
  }

  finishReorderDrag(commit) {
    const drag = this.reorderDrag;
    if (!drag) return;
    const { kind, source, placeholder } = drag;
    let destination = null;

    if (commit && placeholder.isConnected) {
      if (kind === 'task') {
        const container = placeholder.parentElement;
        const siblings = [...container.children].filter(element =>
          element.classList.contains('task-item') &&
          !element.classList.contains('reorder-source') &&
          !element.classList.contains('reorder-placeholder')
        );
        const placeholderIndex = [...container.children]
          .slice(0, [...container.children].indexOf(placeholder))
          .filter(element =>
            element.classList.contains('task-item') &&
            !element.classList.contains('reorder-source') &&
            !element.classList.contains('reorder-placeholder')
          ).length;
        destination = {
          sectionId: container.dataset.sectionId,
          beforeTask: siblings[placeholderIndex] || null,
          afterTask: siblings[placeholderIndex - 1] || null
        };
      } else {
        const siblings = [...this.sectionsContainer.children].filter(element =>
          element.classList.contains('task-section') &&
          !element.classList.contains('reorder-source') &&
          !element.classList.contains('reorder-placeholder')
        );
        const placeholderIndex = [...this.sectionsContainer.children]
          .slice(0, [...this.sectionsContainer.children].indexOf(placeholder))
          .filter(element =>
            element.classList.contains('task-section') &&
            !element.classList.contains('reorder-source') &&
            !element.classList.contains('reorder-placeholder')
          ).length;
        destination = {
          beforeSection: siblings[placeholderIndex] || null,
          afterSection: siblings[placeholderIndex - 1] || null
        };
      }
    }

    placeholder.remove();
    source.classList.remove('reorder-source');
    source.style.display = '';
    drag.preview?.remove();
    this.reorderDrag = null;

    if (!destination) return;
    if (kind === 'task') {
      if (destination.beforeTask) {
        this.moveTask(drag.sourceSectionId, drag.sourceId, destination.sectionId, destination.beforeTask.dataset.taskId, 'before');
      } else if (destination.afterTask) {
        this.moveTask(drag.sourceSectionId, drag.sourceId, destination.sectionId, destination.afterTask.dataset.taskId, 'after');
      } else {
        this.moveTask(drag.sourceSectionId, drag.sourceId, destination.sectionId, null, 'after');
      }
    } else if (destination.beforeSection) {
      this.moveSection(drag.sourceId, destination.beforeSection.dataset.sectionId, 'before');
    } else if (destination.afterSection) {
      this.moveSection(drag.sourceId, destination.afterSection.dataset.sectionId, 'after');
    }
  }

  moveTask(fromSectionId, taskId, toSectionId, beforeTaskId, position = 'before') {
    const board = this.getActiveBoard();
    if (!board) return;
    const from = board.sections.find(section => section.id === fromSectionId);
    const to = board.sections.find(section => section.id === toSectionId);
    const index = from?.tasks?.findIndex(task => task.id === taskId) ?? -1;
    if (index < 0 || !to || (from === to && beforeTaskId === taskId)) return;

    this.pushUndoState();
    const [task] = from.tasks.splice(index, 1);
    if (!to.tasks) to.tasks = [];
    const targetIndex = beforeTaskId ? to.tasks.findIndex(item => item.id === beforeTaskId) : -1;
    const insertIndex = targetIndex < 0
      ? (position === 'before' && !beforeTaskId ? 0 : to.tasks.length)
      : targetIndex + (position === 'after' ? 1 : 0);
    to.tasks.splice(insertIndex, 0, task);
    if (this.selectedTaskId === taskId) {
      this.selectedTaskSectionId = to.id;
      this.activeSectionId = to.id;
    }
    board.updatedAt = Date.now();
    this.save();
    this.renderDetail();
  }

  moveSection(fromId, beforeId, position = 'before') {
    const board = this.getActiveBoard();
    if (!board || fromId === beforeId) return;
    const from = board.sections.findIndex(section => section.id === fromId);
    if (from < 0 || !board.sections.some(section => section.id === beforeId)) return;

    this.pushUndoState();
    const [section] = board.sections.splice(from, 1);
    let target = board.sections.findIndex(item => item.id === beforeId);
    if (position === 'after') target += 1;
    board.sections.splice(target, 0, section);
    board.updatedAt = Date.now();
    this.save();
    this.renderDetail();
  }

  // --- Board Actions ---
  togglePinActiveBoard() {
    const board = this.getActiveBoard();
    if (!board) return;
    board.pinned = !board.pinned;
    board.updatedAt = Date.now();
    this.save();
    this.renderOverview();
    this.renderDetail();
    this.showToast(board.pinned ? t('boardPinned') : t('boardUnpinned'));
  }

  confirmDeleteActiveBoard() {
    const board = this.getActiveBoard();
    if (!board) return;

    this.showConfirmDialog(
      t('deleteBoard'),
      t('confirmDeleteBoard'),
      t('delete'),
      () => {
        this.state.boards = this.state.boards.filter(b => b.id !== board.id);
        this.state.activeBoardId = this.state.boards[0]?.id || null;
        this.save();
        this.renderOverview();
        if (window.innerWidth < 860) {
          this.closeDetail();
        } else {
          this.renderDetail();
        }
        this.showToast(t('boardDeleted'));
      }
    );
  }

  // --- Modals & Dialogs ---
  showConfirmDialog(title, message, confirmBtnText, onConfirm) {
    const titleEl = document.getElementById('confirmModalTitle');
    const msgEl = document.getElementById('confirmModalMessage');
    const btnConfirm = document.getElementById('btnConfirmAction');
    const btnCancel = document.getElementById('btnConfirmCancel');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (btnConfirm) btnConfirm.textContent = confirmBtnText;

    const handleConfirm = () => {
      this.closeModal(this.confirmModal);
      btnConfirm.removeEventListener('click', handleConfirm);
      onConfirm();
    };

    const handleCancel = () => {
      this.closeModal(this.confirmModal);
      btnConfirm.removeEventListener('click', handleConfirm);
    };

    btnConfirm.onclick = handleConfirm;
    btnCancel.onclick = handleCancel;
    this.openModal(this.confirmModal);
  }

  openModal(modal) {
    if (modal) modal.classList.add('open');
  }

  closeModal(modal) {
    if (modal) modal.classList.remove('open');
  }

  showToast(message, duration = 2200) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, duration);
  }

  // --- Static Translations Update ---
  updateStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = t(key);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      el.setAttribute('aria-label', t(key));
    });

    if (this.brandTitleEl) {
      this.brandTitleEl.textContent = t('appTitle');
    }

    this.updateSortUI();
  }

  // --- Event Binding ---
  bindEvents() {
    // Mobile Back Button
    if (this.btnBack) {
      this.btnBack.addEventListener('click', () => {
        this.closeDetail();
      });
    }

    // Detail Title Input Change
    if (this.detailTitleInput) {
      this.detailTitleInput.addEventListener('input', () => {
        const board = this.getActiveBoard();
        if (board) {
          board.title = this.detailTitleInput.value;
          board.updatedAt = Date.now();
          this.save();
          this.renderOverview();
        }
      });
    }

    // Undo button
    if (this.btnUndo) {
      this.btnUndo.addEventListener('click', () => {
        this.undo();
      });
    }

    // Main Menu Dropdown Toggle
    if (this.btnMainMenu && this.mainMenuDropdown) {
      this.btnMainMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeSortSubmenu();
        this.mainMenuDropdown.classList.toggle('open');
        if (this.detailMenuDropdown) this.detailMenuDropdown.classList.remove('open');
      });
    }

    // Detail Menu Dropdown Toggle
    if (this.btnDetailMenu && this.detailMenuDropdown) {
      this.btnDetailMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        this.detailMenuDropdown.classList.toggle('open');
        if (this.mainMenuDropdown) this.mainMenuDropdown.classList.remove('open');
      });
    }

    // Close Dropdowns on Click Outside
    document.addEventListener('click', () => {
      if (this.mainMenuDropdown) this.mainMenuDropdown.classList.remove('open');
      if (this.detailMenuDropdown) this.detailMenuDropdown.classList.remove('open');
    });

    // Main Menu Items
    document.getElementById('menuItemSelectBoards')?.addEventListener('click', () => {
      if (this.mainMenuDropdown) this.mainMenuDropdown.classList.remove('open');
      this.startSelectionMode();
    });

    document.getElementById('menuItemSortBy')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openSortSubmenu();
    });

    document.getElementById('btnBackToSortMenu')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeSortSubmenu();
    });

    // Submenu Sort criteria click events
    document.querySelectorAll('.sort-option-item[data-sort]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const criteria = el.getAttribute('data-sort');
        this.setSortCriteria(criteria);
      });
    });

    // Submenu Sort order click events
    document.querySelectorAll('.sort-option-item[data-order]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const order = el.getAttribute('data-order');
        this.setSortOrder(order);
      });
    });

    document.getElementById('menuItemDarkMode')?.addEventListener('click', () => {
      if (this.mainMenuDropdown) this.mainMenuDropdown.classList.remove('open');
      this.toggleThemeDirectly();
    });

    document.getElementById('menuItemSettings')?.addEventListener('click', () => {
      if (this.mainMenuDropdown) this.mainMenuDropdown.classList.remove('open');
      this.populateSettingsForm();
      this.openModal(this.settingsModal);
    });

    // Selection Action Bar Events
    if (this.btnDeleteSelected) {
      this.btnDeleteSelected.addEventListener('click', () => {
        this.confirmDeleteSelectedBoards();
      });
    }

    if (this.btnCancelSelection) {
      this.btnCancelSelection.addEventListener('click', () => {
        this.endSelectionMode();
      });
    }

    // Detail Menu Actions
    document.getElementById('menuItemPin')?.addEventListener('click', () => {
      if (this.detailMenuDropdown) this.detailMenuDropdown.classList.remove('open');
      this.togglePinActiveBoard();
    });

    document.getElementById('menuItemDelete')?.addEventListener('click', () => {
      if (this.detailMenuDropdown) this.detailMenuDropdown.classList.remove('open');
      this.confirmDeleteActiveBoard();
    });

    // Pinned Section Toggle Collapse / Expand
    if (this.btnTogglePinned) {
      this.btnTogglePinned.addEventListener('click', () => {
        this.state.settings.pinnedCollapsed = !this.state.settings.pinnedCollapsed;
        this.save();
        if (this.pinnedContainer) {
          this.pinnedContainer.classList.toggle('collapsed', this.state.settings.pinnedCollapsed);
          this.btnTogglePinned.classList.toggle('collapsed', this.state.settings.pinnedCollapsed);
        }
      });
    }

    // FAB: Create New Board
    if (this.btnFab) {
      this.btnFab.addEventListener('click', () => {
        const input = document.getElementById('newBoardTitleInput');
        if (input) input.value = '';
        this.openModal(this.newBoardModal);
        // Automatically focus and open mobile keyboard!
        setTimeout(() => {
          if (input) {
            input.focus();
          }
        }, 150);
      });
    }

    // New Board Modal Confirm
    document.getElementById('btnCreateBoardConfirm')?.addEventListener('click', () => {
      const input = document.getElementById('newBoardTitleInput');
      const title = input?.value.trim() || t('newBoard');
      const newBoard = {
        id: generateId('b'),
        title: title,
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sections: [] // Completely empty sections by default as requested!
      };
      this.state.boards.unshift(newBoard);
      this.save();
      this.closeModal(this.newBoardModal);
      this.openBoard(newBoard.id);
      this.showToast(t('boardCreated'));
      this.detailTitleInput?.focus();
      this.detailTitleInput?.select();
    });

    document.getElementById('newBoardTitleInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btnCreateBoardConfirm')?.click();
      }
    });

    document.getElementById('btnCreateBoardCancel')?.addEventListener('click', () => {
      this.closeModal(this.newBoardModal);
    });

    // Detail Bottom Toolbar Actions
    if (this.btnAddTask) {
      this.btnAddTask.addEventListener('click', () => {
        this.addTaskAtCursorOrBottom();
      });
    }
    this.btnEditTask?.addEventListener('click', () => this.editSelectedTask());
    if (this.btnAddSection) {
      this.btnAddSection.addEventListener('click', () => {
        const input = document.getElementById('newSectionTitleInput');
        if (input) input.value = '';
        this.openModal(this.newSectionModal);
        setTimeout(() => input?.focus(), 150);
      });
    }

    document.getElementById('btnCreateSectionConfirm')?.addEventListener('click', () => {
      const input = document.getElementById('newSectionTitleInput');
      const title = input?.value.trim() || '';
      this.addSection(title);
      this.closeModal(this.newSectionModal);
    });

    document.getElementById('btnCreateSectionCancel')?.addEventListener('click', () => {
      this.closeModal(this.newSectionModal);
    });

    if (this.btnCrossOut) {
      this.btnCrossOut.addEventListener('click', () => {
        this.crossOutActiveTask();
      });
    }
    // Settings Modal Events
    this.bindSettingsEvents();

    // Scroll tracking
    if (this.masterView) {
      const mc = this.masterView.querySelector('.master-content');
      if (mc) {
        mc.addEventListener('scroll', () => {
          if (!this.state.scrollPositions) this.state.scrollPositions = {};
          this.state.scrollPositions.overview = mc.scrollTop;
        }, { passive: true });
      }
    }

    if (this.detailContent) {
      this.detailContent.addEventListener('scroll', () => {
        if (this.state.activeBoardId) {
          if (!this.state.scrollPositions) this.state.scrollPositions = {};
          this.state.scrollPositions[`b_${this.state.activeBoardId}`] = this.detailContent.scrollTop;
        }
      }, { passive: true });
    }

    window.addEventListener('beforeunload', () => {
      this.cleanUpEmptyTasks();
      this.saveScrollPosition();
    });

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.state.settings.theme === 'system') {
          this.applyTheme('system');
        }
      });
    }
  }

  // --- Settings Form & Logic ---
  populateSettingsForm() {
    const langSelect = document.getElementById('settingLanguage');
    if (langSelect) langSelect.value = this.state.settings.language || 'en';
  }

  bindSettingsEvents() {
    const langSelect = document.getElementById('settingLanguage');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const btnExport = document.getElementById('btnExportData');
    const btnImport = document.getElementById('btnImportData');
    const importFileInput = document.getElementById('importFileInput');
    const btnResetAll = document.getElementById('btnResetAllData');

    langSelect?.addEventListener('change', () => {
      const newLang = langSelect.value;
      this.state.settings.language = newLang;
      setLanguage(newLang);
      this.save();
      this.updateStaticTranslations();
      this.renderOverview();
      this.renderDetail();
      this.populateSettingsForm();
    });

    btnCloseSettings?.addEventListener('click', () => {
      this.closeModal(this.settingsModal);
    });

    btnExport?.addEventListener('click', () => {
      exportDataToFile(this.state);
      this.showToast(t('exportSuccess'));
    });

    btnImport?.addEventListener('click', () => {
      importFileInput?.click();
    });

    importFileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const parsed = parseImportJSON(text);
        if (!parsed) {
          alert(t('importInvalid'));
          return;
        }

        const shouldReplace = window.confirm(`${t('importReplaceOrMerge')}\n\nOK: ${t('importMerge')}\nCancel: ${t('importReplace')}`);
        this.state = mergeImportData(this.state, parsed, !shouldReplace);
        this.save();
        this.init();
        this.closeModal(this.settingsModal);
        this.showToast(t('importSuccess'));
      };
      reader.readAsText(file);
      importFileInput.value = '';
    });

    btnResetAll?.addEventListener('click', () => {
      this.showConfirmDialog(
        t('resetData'),
        t('confirmResetData'),
        t('resetData'),
        () => {
          clearAllStorage();
          this.state = getDefaultState();
          this.save();
          this.init();
          this.closeModal(this.settingsModal);
          this.showToast(t('resetSuccess'));
        }
      );
    });
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
