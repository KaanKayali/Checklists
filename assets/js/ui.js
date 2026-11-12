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
    this.bindVisualViewport();
  }

  // --- Dynamic Keyboard Adaptation on Mobile ---
  bindVisualViewport() {
    if (window.visualViewport) {
      const onViewportChange = () => {
        if (!this.detailToolbar) return;
        const currentViewport = window.visualViewport;
        const offsetBottom = Math.max(0, window.innerHeight - (currentViewport.height + currentViewport.offsetTop));
        if (offsetBottom > 50) {
          // Keyboard is open! Stick toolbar directly above keyboard
          this.detailToolbar.style.bottom = `${offsetBottom}px`;
        } else {
          // Keyboard is closed
          this.detailToolbar.style.bottom = '0px';
        }
      };
      window.visualViewport.addEventListener('resize', onViewportChange);
      window.visualViewport.addEventListener('scroll', onViewportChange);
    }
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
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', themeBg);
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
            </button>
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

    setTimeout(() => {
      const input = this.sectionsContainer.querySelector(`.task-input[data-task-id="${newTask.id}"]`);
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
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

    let targetSection = board.sections[0];
    if (this.activeSectionId) {
      const found = board.sections.find(s => s.id === this.activeSectionId);
      if (found) targetSection = found;
    }
    const focusedSectionTitle = document.activeElement?.closest('.task-section')?.dataset.sectionId;
    if (focusedSectionTitle) targetSection = board.sections.find(s => s.id === focusedSectionTitle) || targetSection;
    if (!targetSection.tasks) targetSection.tasks = [];

    const newTask = {
      id: generateId('task'),
      text: '',
      completed: false,
      crossedOut: false
    };

    if (this.activeTaskId) {
      const curIndex = targetSection.tasks.findIndex(t => t.id === this.activeTaskId);
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

    // Immediately focus input so keyboard opens up!
    setTimeout(() => {
      const input = this.sectionsContainer.querySelector(`.task-input[data-task-id="${newTask.id}"]`);
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
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

    setTimeout(() => {
      const input = this.sectionsContainer.querySelector(`.task-input[data-section-id="${newSec.id}"]`);
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
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
    const taskItems = this.sectionsContainer.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
      const contentWrapper = item.querySelector('.task-content-wrapper');
      const swipeAction = item.querySelector('.task-swipe-action');
      const taskId = item.getAttribute('data-task-id');
      const sectionId = item.getAttribute('data-section-id');

      let startX = 0;
      let startY = 0;
      let isSwiping = false;
      let holdTimer = null;
      let holdDrag = false;
      let wasDeleteRevealed = false;

      item.draggable = true;
      item.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', JSON.stringify({ taskId, sectionId }));
        event.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragover', (event) => {
        event.preventDefault();
        const rect = item.getBoundingClientRect();
        item.dataset.dropPosition = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
        this.sectionsContainer.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-target'));
        item.classList.add('drag-target');
      });
      item.addEventListener('dragleave', () => { item.classList.remove('drag-target'); delete item.dataset.dropPosition; });
      item.addEventListener('drop', (event) => {
        event.preventDefault();
        const position = item.dataset.dropPosition || 'before'; item.classList.remove('drag-target');
        try { const data = JSON.parse(event.dataTransfer.getData('text/plain')); this.moveTask(data.sectionId, data.taskId, sectionId, taskId, position); } catch {}
      });

      item.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        wasDeleteRevealed = item.classList.contains('delete-revealed');
        isSwiping = false;
        holdDrag = false;
        contentWrapper.style.transition = 'none';
        holdTimer = setTimeout(() => { holdDrag = true; item.classList.add('dragging'); if (navigator.vibrate) navigator.vibrate(25); }, 420);
      }, { passive: true });

      item.addEventListener('touchmove', (e) => {
        if (holdTimer && (Math.abs(e.touches[0].clientX - startX) > 12 || Math.abs(e.touches[0].clientY - startY) > 12)) { clearTimeout(holdTimer); holdTimer = null; }
        if (holdDrag) {
          e.preventDefault();
          const target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)?.closest('.task-item');
          this.sectionsContainer.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-target'));
          if (target) { target.dataset.dropPosition = e.touches[0].clientY < target.getBoundingClientRect().top + target.offsetHeight / 2 ? 'before' : 'after'; target.classList.add('drag-target'); }
          return;
        }
        const diffX = e.touches[0].clientX - startX;
        const diffY = e.touches[0].clientY - startY;

        if (Math.abs(diffX) > Math.abs(diffY) && (diffX < 0 || (wasDeleteRevealed && diffX > 0))) {
          isSwiping = true;
          const startOffset = wasDeleteRevealed ? -80 : 0;
          const translateX = Math.min(0, Math.max(-100, startOffset + diffX));
          contentWrapper.style.transform = `translateX(${translateX}px)`;
        }
      }, { passive: false });

      item.addEventListener('touchend', (e) => {
        clearTimeout(holdTimer); holdTimer = null;
        if (holdDrag) {
          item.classList.remove('dragging');
          const target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)?.closest('.task-item');
          this.sectionsContainer.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-target'));
          if (target && target !== item) this.moveTask(sectionId, taskId, target.dataset.sectionId, target.dataset.taskId, target.dataset.dropPosition || 'before');
          holdDrag = false; return;
        }
        if (!isSwiping) {
          contentWrapper.style.transition = '';
          return;
        }
        contentWrapper.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        const diffX = e.changedTouches[0].clientX - startX;

        if (diffX < -70) {
          item.classList.add('delete-revealed');
          swipeAction.removeAttribute('aria-hidden');
          swipeAction.tabIndex = 0;
          contentWrapper.style.transform = '';
        } else if (wasDeleteRevealed && diffX > 40) {
          item.classList.remove('delete-revealed');
          swipeAction.setAttribute('aria-hidden', 'true');
          swipeAction.tabIndex = -1;
          contentWrapper.style.transform = '';
        } else if (wasDeleteRevealed) {
          contentWrapper.style.transform = '';
        } else {
          contentWrapper.style.transform = '';
        }
      });
    });

    this.sectionsContainer.querySelectorAll('.task-section').forEach(sectionEl => {
      sectionEl.addEventListener('click', (event) => {
        if (event.target.closest('button, .task-item')) return;
        this.activeSectionId = sectionEl.dataset.sectionId;
        this.activeTaskId = null;
        this.sectionsContainer.querySelectorAll('.task-section').forEach(el => el.classList.toggle('section-selected', el === sectionEl));
      });
      sectionEl.draggable = true;
      sectionEl.addEventListener('dragstart', event => { if (event.target.closest('.task-item')) { event.preventDefault(); return; } event.dataTransfer.setData('application/x-section', sectionEl.dataset.sectionId); event.dataTransfer.effectAllowed = 'move'; });
      sectionEl.addEventListener('dragover', event => { if (event.dataTransfer.types.includes('application/x-section')) event.preventDefault(); });
      sectionEl.addEventListener('drop', event => {
        const fromId = event.dataTransfer.getData('application/x-section'); if (!fromId) return;
        event.preventDefault(); this.moveSection(fromId, sectionEl.dataset.sectionId);
      });
    });

    this.sectionsContainer.querySelectorAll('.task-section').forEach(section => {
      let timer;
      section.addEventListener('touchstart', e => {
        if (e.target.closest('.task-item, input, button')) return;
        const y = e.touches[0].clientY;
        timer = setTimeout(() => { section.dataset.holdDrag = 'true'; section.classList.add('dragging'); if (navigator.vibrate) navigator.vibrate(25); }, 420);
        section.dataset.holdY = y;
      }, { passive: true });
      section.addEventListener('touchmove', e => {
        if (!timer) return;
        if (Math.abs(e.touches[0].clientY - Number(section.dataset.holdY)) > 12 && section.dataset.holdDrag !== 'true') { clearTimeout(timer); timer = null; }
        if (section.dataset.holdDrag === 'true') {
          e.preventDefault();
          const target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)?.closest('.task-section');
          this.sectionsContainer.querySelectorAll('.task-section').forEach(el => el.classList.remove('drag-target'));
          if (target) { target.dataset.dropPosition = e.touches[0].clientY < target.getBoundingClientRect().top + target.offsetHeight / 2 ? 'before' : 'after'; target.classList.add('drag-target'); }
        }
      }, { passive: false });
      section.addEventListener('touchend', e => {
        clearTimeout(timer); timer = null;
        if (section.dataset.holdDrag === 'true') {
          const target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)?.closest('.task-section');
          if (target && target !== section) this.moveSection(section.dataset.sectionId, target.dataset.sectionId, target.dataset.dropPosition || 'before');
          delete section.dataset.holdDrag; this.sectionsContainer.querySelectorAll('.task-section').forEach(el => el.classList.remove('dragging', 'drag-target'));
        }
      });
    });
  }

  moveTask(fromSectionId, taskId, toSectionId, beforeTaskId, position = 'before') {
    const board = this.getActiveBoard(); if (!board) return;
    const from = board.sections.find(s => s.id === fromSectionId), to = board.sections.find(s => s.id === toSectionId);
    const index = from?.tasks?.findIndex(t => t.id === taskId) ?? -1; if (index < 0 || !to) return;
    this.pushUndoState(); const [task] = from.tasks.splice(index, 1); task.sectionId = to.id;
    let target = to.tasks.findIndex(t => t.id === beforeTaskId);
    if (target < 0) target = to.tasks.length;
    else if (position === 'after') target += 1;
    if (from === to && target > index) target -= 1;
    to.tasks.splice(target, 0, task);
    board.updatedAt = Date.now(); this.save(); this.renderDetail();
  }

  moveSection(fromId, beforeId, position = 'before') {
    const board = this.getActiveBoard(); if (!board || fromId === beforeId) return;
    const from = board.sections.findIndex(s => s.id === fromId), before = board.sections.findIndex(s => s.id === beforeId);
    if (from < 0 || before < 0) return;
    this.pushUndoState(); const [section] = board.sections.splice(from, 1); let target = board.sections.findIndex(s => s.id === beforeId); if (position === 'after') target += 1; board.sections.splice(target, 0, section);
    board.updatedAt = Date.now(); this.save(); this.renderDetail();
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
      setTimeout(() => { this.detailTitleInput?.focus(); this.detailTitleInput?.select(); }, 80);
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
