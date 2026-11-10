/**
 * UI Controller for Checklists Web Application
 * Handles DOM rendering, cursor tracking, gestures, undo stack, and interactions.
 * Configured for Boards structure matching design wireframe & reference images.
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
    this.menuSortSubtitle = document.getElementById('menuSortSubtitle');
    this.darkModeIcon = document.getElementById('darkModeIcon');

    // Master View lists
    this.pinnedSectionContainer = document.getElementById('pinnedSectionContainer');
    this.btnTogglePinned = document.getElementById('btnTogglePinned');
    this.pinnedContainer = document.getElementById('pinnedContainer');
    this.allContainer = document.getElementById('allContainer');
    this.btnFab = document.getElementById('btnFab');

    // Detail View elements
    this.btnBack = document.getElementById('btnBack');
    this.detailTitleInput = document.getElementById('detailTitleInput');
    this.detailTimestampsEl = document.getElementById('detailTimestamps');
    this.btnUndo = document.getElementById('btnUndo');
    this.btnDetailMenu = document.getElementById('btnDetailMenu');
    this.detailMenuDropdown = document.getElementById('detailMenuDropdown');
    this.pinMenuLabel = document.getElementById('pinMenuLabel');
    this.pinMenuIcon = document.getElementById('pinMenuIcon');
    this.detailContent = document.getElementById('detailContent');
    this.sectionsContainer = document.getElementById('sectionsContainer');

    // Detail Toolbar
    this.btnAddTask = document.getElementById('btnAddTask');
    this.btnAddSection = document.getElementById('btnAddSection');
    this.btnCrossOut = document.getElementById('btnCrossOut');
    this.btnClearText = document.getElementById('btnClearText');

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
    this.applyFontSize(this.state.settings.fontSize);
    setLanguage(this.state.settings.language);

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
    this.updateSortSubtitle();
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
    
    // Header safe area and theme-color matches the background of the theme
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
    this.showToast(`${t('darkMode')}: ${next === 'dark' ? t('themeDark') : t('themeLight')}`);
  }

  applyFontSize(size) {
    this.state.settings.fontSize = size;
    document.documentElement.setAttribute('data-font-size', size);
    this.save();
  }

  // --- Sorting ---
  getSortedBoards(boards) {
    const list = [...boards];
    const sortBy = this.state.settings.sortBy || 'updatedAt_desc';

    if (sortBy === 'updatedAt_desc') {
      return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    if (sortBy === 'createdAt_desc') {
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    if (sortBy === 'title_asc') {
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return list;
  }

  cycleSortOrder() {
    const current = this.state.settings.sortBy || 'updatedAt_desc';
    let next = 'updatedAt_desc';
    if (current === 'updatedAt_desc') next = 'createdAt_desc';
    else if (current === 'createdAt_desc') next = 'title_asc';
    else if (current === 'title_asc') next = 'manual';
    else next = 'updatedAt_desc';

    this.state.settings.sortBy = next;
    this.save();
    this.updateSortSubtitle();
    this.renderOverview();
    this.showToast(`${t('sortBy')}: ${this.getSortLabel(next)}`);
  }

  getSortLabel(sortBy) {
    if (sortBy === 'updatedAt_desc') return t('sortDefault');
    if (sortBy === 'createdAt_desc') return t('sortCreated');
    if (sortBy === 'title_asc') return t('sortTitle');
    return t('sortDefault');
  }

  updateSortSubtitle() {
    if (this.menuSortSubtitle) {
      const sortBy = this.state.settings.sortBy || 'updatedAt_desc';
      this.menuSortSubtitle.textContent = this.getSortLabel(sortBy);
    }
  }

  // --- View Switching ---
  openBoard(id, pushHistory = true) {
    this.saveScrollPosition();
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
    this.saveScrollPosition();
    this.viewContainer.classList.remove('detail-active');
    this.state.activeBoardId = null;
    this.activeTaskId = null;
    this.save();
    this.renderOverview();
  }

  // --- Rendering Overview (Master View) ---
  renderOverview() {
    const all = this.getSortedBoards(this.state.boards || []);
    const pinned = all.filter(b => b.pinned);
    const unpinned = all.filter(b => !b.pinned);

    // Update Counter (stands below the title header above boards)
    if (this.boardCounterEl) {
      this.boardCounterEl.textContent = t('boardCounter', all.length);
    }

    // Render Pinned Boards
    if (this.pinnedSectionContainer && this.pinnedContainer) {
      if (pinned.length > 0) {
        this.pinnedSectionContainer.style.display = 'block';
        this.pinnedContainer.innerHTML = pinned.map(b => this.createBoardRowHTML(b)).join('');
        
        // Handle collapse state
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
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
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
        this.openBoard(id);
      });
    });
  }

  /**
   * Generates Board row HTML matching Image 1 & Image 2 wireframe:
   * - Board title (bold, wraps onto next line without ellipsis)
   * - Timestamp underneath: Only time if today, only Yesterday if yesterday, date like 28.10.2026 if earlier.
   * - NO "edited" text anywhere.
   * - Followed by task / section preview.
   * - NO "done" counter badge.
   */
  createBoardRowHTML(board) {
    const isActive = board.id === this.state.activeBoardId;
    
    // Find preview text: first task text, or first section title
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
      <div class="board-row ${isActive ? 'active' : ''}" data-id="${board.id}">
        <div class="board-row-title">${this.escapeHTML(board.title || t('newBoard'))}</div>
        <div class="board-row-meta">
          <span class="board-timestamp">${this.escapeHTML(timestampStr)}</span>
          ${previewText ? `<span class="board-preview-text">${this.escapeHTML(previewText)}</span>` : ''}
        </div>
      </div>
    `;
  }

  // --- Rendering Detail View ---
  renderDetail() {
    const board = this.getActiveBoard();
    if (!board) {
      if (this.detailTitleInput) this.detailTitleInput.value = '';
      if (this.detailTimestampsEl) this.detailTimestampsEl.textContent = '';
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

    // Exact Timestamps: "Created 09. November 2024 | Edited 10. November 2026 at 16:30"
    if (this.detailTimestampsEl) {
      const createdStr = formatFullDate(board.createdAt || Date.now());
      const editedDateStr = formatFullDate(board.updatedAt || Date.now());
      const editedTimeStr = formatTime(board.updatedAt || Date.now());
      this.detailTimestampsEl.textContent = `${t('createdOn', createdStr)} | ${t('editedOn', editedDateStr, editedTimeStr)}`;
    }

    // Update Pin/Unpin menu item label and icon
    if (this.pinMenuLabel) {
      this.pinMenuLabel.textContent = board.pinned ? t('unpin') : t('pin');
    }
    if (this.pinMenuIcon) {
      if (board.pinned) {
        // Unpin icon
        this.pinMenuIcon.innerHTML = `<path d="M16 9V4l1 0V2H7v2l1 0v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z M2 2l20 20-1.41 1.41L13.8 16.6l-.8.8v6l-1 1-1-1v-6.97L5 14v-2c.6-.6 1.1-1.3 1.3-2.1L2 2z"/>`;
      } else {
        // Pin icon
        this.pinMenuIcon.innerHTML = `<path d="M16 9V4l1 0V2H7v2l1 0v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>`;
      }
    }

    // Render Sections and tasks
    if (this.sectionsContainer) {
      if (!board.sections || board.sections.length === 0) {
        board.sections = [{ id: generateId('sec'), title: '', tasks: [] }];
      }

      this.sectionsContainer.innerHTML = board.sections.map((section) => `
        <div class="task-section" data-section-id="${section.id}">
          <div class="task-section-header">
            <input type="text" 
                   class="section-title-input" 
                   value="${this.escapeHTML(section.title || '')}" 
                   placeholder="${t('sectionTitlePlaceholder')}"
                   data-section-id="${section.id}">
            ${board.sections.length > 1 ? `
              <button class="btn-section-delete" data-section-id="${section.id}" title="${t('delete')}">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            ` : ''}
          </div>
          <div class="tasks-container" data-section-id="${section.id}">
            ${(section.tasks && section.tasks.length > 0) ? section.tasks.map(task => this.createTaskItemHTML(task, section.id)).join('') : `
              <div class="empty-state" style="padding: 12px 0 8px 0;">
                <div class="empty-state-sub" style="font-size: 0.85rem;">${t('noTasksInSection')}</div>
              </div>
            `}
          </div>
        </div>
      `).join('');

      this.bindTaskSectionEvents();
    }

    this.updateUndoButtonState();
  }

  createTaskItemHTML(task, sectionId) {
    const isCompleted = !!task.completed;
    const isCrossed = !!task.crossedOut;

    // Checked tasks are NOT strikethrough; only crossedOut tasks are strikethrough
    return `
      <div class="task-item ${isCompleted ? 'completed' : ''} ${isCrossed ? 'crossed-out' : ''}" 
           data-task-id="${task.id}" 
           data-section-id="${sectionId}">
        
        <!-- Swipe Delete Action Background -->
        <div class="task-swipe-action" data-task-id="${task.id}" data-section-id="${sectionId}">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </div>

        <div class="task-content-wrapper">
          <!-- Circular Badge Checkbox: solid #ffc114 with white checkmark when completed -->
          <div class="custom-checkbox" data-task-id="${task.id}" data-section-id="${sectionId}" title="Toggle">
            <svg viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>

          <!-- Task Text Input: Wraps onto next line without '...' -->
          <textarea class="task-input" 
                    rows="1"
                    placeholder="${t('addTaskPlaceholder')}" 
                    data-task-id="${task.id}" 
                    data-section-id="${sectionId}">${this.escapeHTML(task.text || '')}</textarea>

          <!-- Desktop Delete Button (visible on hover) -->
          <button class="btn-task-delete-desktop" data-task-id="${task.id}" data-section-id="${sectionId}" title="${t('delete')}">
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
    });

    // Section title change
    const sectionInputs = this.sectionsContainer.querySelectorAll('.section-title-input');
    sectionInputs.forEach(input => {
      input.addEventListener('input', () => {
        const secId = input.getAttribute('data-section-id');
        const board = this.getActiveBoard();
        if (board) {
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
        this.deleteSection(secId);
      });
    });

    // Task text textarea events & Cursor Logic
    const taskInputs = this.sectionsContainer.querySelectorAll('.task-input');
    taskInputs.forEach(input => {
      const taskId = input.getAttribute('data-task-id');
      const sectionId = input.getAttribute('data-section-id');

      // Auto-resize height to fit wrapped content
      const autoResize = () => {
        input.style.height = 'auto';
        input.style.height = `${input.scrollHeight}px`;
      };
      autoResize();

      // Focus: track active cursor (NO yellow outline)
      input.addEventListener('focus', () => {
        this.activeTaskId = taskId;
        this.activeSectionId = sectionId;
      });

      // Text input change
      input.addEventListener('input', () => {
        autoResize();
        const board = this.getActiveBoard();
        if (board) {
          const sec = board.sections.find(s => s.id === sectionId);
          if (sec) {
            const task = sec.tasks.find(t => t.id === taskId);
            if (task) {
              task.text = input.value;
              board.updatedAt = Date.now();
              this.save();
            }
          }
        }
      });

      // Keydown: Enter creates next task, Backspace on empty deletes task
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.insertTaskBelow(sectionId, taskId);
        } else if (e.key === 'Backspace' && input.value.trim() === '') {
          e.preventDefault();
          this.deleteTaskAndFocusPrev(sectionId, taskId);
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

    // Mobile Swipe-to-delete gestures
    this.bindSwipeGestures();
  }

  // --- Task Operations & Cursor Logic ---

  toggleTaskCompleted(sectionId, taskId) {
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board) return;
    const sec = board.sections.find(s => s.id === sectionId);
    if (!sec) return;
    const task = sec.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    board.updatedAt = Date.now();
    this.save();
    this.renderOverview();
    this.renderDetail();
  }

  crossOutActiveTask() {
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board) return;

    let targetTask = null;

    if (this.activeTaskId) {
      for (const sec of board.sections) {
        const found = sec.tasks.find(t => t.id === this.activeTaskId);
        if (found) {
          targetTask = found;
          break;
        }
      }
    }

    if (!targetTask && board.sections[0]?.tasks.length > 0) {
      const sec = board.sections[0];
      targetTask = sec.tasks[sec.tasks.length - 1];
    }

    if (targetTask) {
      targetTask.crossedOut = !targetTask.crossedOut;
      board.updatedAt = Date.now();
      this.save();
      this.renderDetail();
      this.showToast(targetTask.crossedOut ? t('crossOutTask') : t('uncrossTask'));
    }
  }

  clearActiveTaskText() {
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board || !this.activeTaskId) return;

    for (const sec of board.sections) {
      const task = sec.tasks.find(t => t.id === this.activeTaskId);
      if (task) {
        task.text = '';
        board.updatedAt = Date.now();
        this.save();
        this.renderDetail();
        
        setTimeout(() => {
          const input = this.sectionsContainer.querySelector(`.task-input[data-task-id="${task.id}"]`);
          if (input) input.focus();
        }, 50);
        this.showToast(t('clearText'));
        break;
      }
    }
  }

  insertTaskBelow(sectionId, currentTaskId) {
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board) return;
    const sec = board.sections.find(s => s.id === sectionId);
    if (!sec) return;

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
    this.save();
    this.renderOverview();
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

  addTaskAtCursorOrBottom() {
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board) return;

    if (!board.sections || board.sections.length === 0) {
      board.sections = [{ id: generateId('sec'), title: '', tasks: [] }];
    }

    let targetSection = board.sections[0];
    if (this.activeSectionId) {
      const found = board.sections.find(s => s.id === this.activeSectionId);
      if (found) targetSection = found;
    }

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
    this.save();
    this.renderOverview();
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

  deleteTask(sectionId, taskId) {
    this.pushUndoState();
    const board = this.getActiveBoard();
    if (!board) return;
    const sec = board.sections.find(s => s.id === sectionId);
    if (!sec) return;

    sec.tasks = sec.tasks.filter(t => t.id !== taskId);
    if (this.activeTaskId === taskId) {
      this.activeTaskId = null;
    }
    board.updatedAt = Date.now();
    this.save();
    this.renderOverview();
    this.renderDetail();
  }

  deleteTaskAndFocusPrev(sectionId, taskId) {
    const board = this.getActiveBoard();
    if (!board) return;
    const sec = board.sections.find(s => s.id === sectionId);
    if (!sec) return;

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

    const newSec = {
      id: generateId('sec'),
      title: title || '',
      tasks: [{ id: generateId('task'), text: '', completed: false, crossedOut: false }]
    };

    board.sections.push(newSec);
    board.updatedAt = Date.now();
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
    if (!board || board.sections.length <= 1) return;

    board.sections = board.sections.filter(s => s.id !== sectionId);
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

      item.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = false;
        contentWrapper.style.transition = 'none';
      }, { passive: true });

      item.addEventListener('touchmove', (e) => {
        const diffX = e.touches[0].clientX - startX;
        const diffY = e.touches[0].clientY - startY;

        if (Math.abs(diffX) > Math.abs(diffY) && diffX < 0) {
          isSwiping = true;
          let translateX = diffX;
          if (translateX < -80) {
            translateX = -80 + (diffX + 80) * 0.2;
          }
          contentWrapper.style.transform = `translateX(${translateX}px)`;
        }
      }, { passive: true });

      item.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        contentWrapper.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        const diffX = e.changedTouches[0].clientX - startX;

        if (diffX < -70) {
          contentWrapper.style.transform = 'translateX(-100%)';
          setTimeout(() => {
            this.deleteTask(sectionId, taskId);
            this.showToast(t('delete'));
          }, 200);
        } else {
          contentWrapper.style.transform = 'translateX(0)';
        }
      });

      if (swipeAction) {
        swipeAction.addEventListener('click', () => {
          this.deleteTask(sectionId, taskId);
        });
      }
    });
  }

  // --- Board Actions (Pin/Unpin, Delete) ---
  togglePinActiveBoard() {
    const board = this.getActiveBoard();
    if (!board) return;
    board.pinned = !board.pinned;
    board.updatedAt = Date.now();
    this.save();
    this.renderOverview();
    this.renderDetail();
    this.showToast(board.pinned ? t('pin') : t('unpin'));
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
        this.showToast(t('deleteBoard'));
      }
    );
  }

  // --- Modals, Dropdowns & Dialogs ---
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

    if (this.brandTitleEl) {
      this.brandTitleEl.textContent = t('appTitle');
    }

    this.updateSortSubtitle();
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

    // Main Menu Items (Select Boards, Sort By, Dark Mode, Settings)
    document.getElementById('menuItemSelectBoards')?.addEventListener('click', () => {
      if (this.mainMenuDropdown) this.mainMenuDropdown.classList.remove('open');
      this.showToast(t('selectBoards'));
    });

    document.getElementById('menuItemSortBy')?.addEventListener('click', () => {
      if (this.mainMenuDropdown) this.mainMenuDropdown.classList.remove('open');
      this.cycleSortOrder();
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

    // Detail Menu Actions: Pin/Unpin, Delete Board only
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
        setTimeout(() => input?.focus(), 100);
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
        sections: [
          {
            id: generateId('sec'),
            title: '',
            tasks: [{ id: generateId('task'), text: '', completed: false, crossedOut: false }]
          }
        ]
      };
      this.state.boards.unshift(newBoard);
      this.save();
      this.closeModal(this.newBoardModal);
      this.openBoard(newBoard.id);
      this.showToast(t('newBoard'));
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

    if (this.btnAddSection) {
      this.btnAddSection.addEventListener('click', () => {
        const input = document.getElementById('newSectionTitleInput');
        if (input) input.value = '';
        this.openModal(this.newSectionModal);
        setTimeout(() => input?.focus(), 100);
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

    if (this.btnClearText) {
      this.btnClearText.addEventListener('click', () => {
        this.clearActiveTaskText();
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
    const fontSelect = document.getElementById('settingFontSize');
    const langSelect = document.getElementById('settingLanguage');

    if (fontSelect) fontSelect.value = this.state.settings.fontSize || 'medium';
    if (langSelect) langSelect.value = this.state.settings.language || 'en';
  }

  bindSettingsEvents() {
    const fontSelect = document.getElementById('settingFontSize');
    const langSelect = document.getElementById('settingLanguage');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const btnExport = document.getElementById('btnExportData');
    const btnImport = document.getElementById('btnImportData');
    const importFileInput = document.getElementById('importFileInput');
    const btnResetAll = document.getElementById('btnResetAllData');

    fontSelect?.addEventListener('change', () => {
      this.applyFontSize(fontSelect.value);
    });

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

    // Export Data
    btnExport?.addEventListener('click', () => {
      exportDataToFile(this.state);
      this.showToast(t('exportData'));
    });

    // Import Data
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

        const shouldReplace = window.confirm(`${t('importReplaceOrMerge')}\n\n[OK] = ${t('importMerge')}\n[Cancel] = ${t('importReplace')}`);
        this.state = mergeImportData(this.state, parsed, !shouldReplace);
        this.save();
        this.init();
        this.closeModal(this.settingsModal);
        this.showToast(t('importSuccess'));
      };
      reader.readAsText(file);
      importFileInput.value = '';
    });

    // Factory Reset Data
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
