/**
 * UI Controller for Checklists Web Application
 * Handles DOM rendering, cursor tracking, gestures, undo stack, and interactions.
 */

import { t, getLanguage, setLanguage, formatFullDate, formatTime, formatRelativeDate } from './i18n.js';
import { generateId, saveData, exportDataToFile, parseImportJSON, mergeImportData, clearAllStorage, getDefaultState } from './storage.js';

export class UIController {
  constructor(state) {
    this.state = state;
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
    this.checklistCounterEl = document.getElementById('checklistCounter');
    this.btnMainMenu = document.getElementById('btnMainMenu');
    this.mainMenuDropdown = document.getElementById('mainMenuDropdown');

    // Master View lists
    this.pinnedSectionContainer = document.getElementById('pinnedSectionContainer');
    this.pinnedListEl = document.getElementById('pinnedList');
    this.allListEl = document.getElementById('allList');
    this.btnFab = document.getElementById('btnFab');

    // Detail View elements
    this.btnBack = document.getElementById('btnBack');
    this.detailTitleInput = document.getElementById('detailTitleInput');
    this.detailTimestampsEl = document.getElementById('detailTimestamps');
    this.btnUndo = document.getElementById('btnUndo');
    this.btnDetailMenu = document.getElementById('btnDetailMenu');
    this.detailMenuDropdown = document.getElementById('detailMenuDropdown');
    this.detailContent = document.getElementById('detailContent');
    this.sectionsContainer = document.getElementById('sectionsContainer');

    // Detail Toolbar
    this.btnAddTask = document.getElementById('btnAddTask');
    this.btnAddSection = document.getElementById('btnAddSection');
    this.btnCrossOut = document.getElementById('btnCrossOut');
    this.btnClearText = document.getElementById('btnClearText');
    this.cursorStatusPill = document.getElementById('cursorStatusPill');

    // Modals
    this.settingsModal = document.getElementById('settingsModal');
    this.newChecklistModal = document.getElementById('newChecklistModal');
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

    // Restore active checklist
    if (this.state.activeChecklistId) {
      const activeCl = this.getChecklist(this.state.activeChecklistId);
      if (activeCl) {
        this.openChecklist(activeCl.id, false);
      } else if (this.state.checklists.length > 0) {
        this.openChecklist(this.state.checklists[0].id, false);
      }
    } else if (window.innerWidth >= 860 && this.state.checklists.length > 0) {
      this.openChecklist(this.state.checklists[0].id, false);
    }

    this.restoreScrollPositions();
    this.updateStaticTranslations();
  }

  // --- State Persistence & Undo ---

  pushUndoState() {
    const activeCl = this.getActiveChecklist();
    if (!activeCl) return;
    const snapshot = JSON.parse(JSON.stringify(activeCl));
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxUndoStack) {
      this.undoStack.shift();
    }
    this.updateUndoButtonState();
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const previousSnapshot = this.undoStack.pop();
    const index = this.state.checklists.findIndex(c => c.id === previousSnapshot.id);
    if (index !== -1) {
      this.state.checklists[index] = previousSnapshot;
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

  getActiveChecklist() {
    return this.state.checklists.find(c => c.id === this.state.activeChecklistId);
  }

  getChecklist(id) {
    return this.state.checklists.find(c => c.id === id);
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
    if (this.state.activeChecklistId && this.detailContent) {
      this.state.scrollPositions[`cl_${this.state.activeChecklistId}`] = this.detailContent.scrollTop;
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

    if (this.state.activeChecklistId && this.detailContent) {
      const savedY = this.state.scrollPositions[`cl_${this.state.activeChecklistId}`];
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
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', effective === 'dark' ? '#1a202c' : '#ffc114');
    }
    this.save();
  }

  applyFontSize(size) {
    this.state.settings.fontSize = size;
    document.documentElement.setAttribute('data-font-size', size);
    this.save();
  }

  // --- Sorting ---
  getSortedChecklists(checklists) {
    const list = [...checklists];
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
    // Default manual order
    return list;
  }

  // --- View Switching ---
  openChecklist(id, pushHistory = true) {
    this.saveScrollPosition();
    this.state.activeChecklistId = id;
    this.activeTaskId = null;
    this.undoStack = [];
    this.updateUndoButtonState();
    this.save();

    this.renderOverview();
    this.renderDetail();

    if (window.innerWidth < 860) {
      this.viewContainer.classList.add('detail-active');
    }

    // Restore scroll for this checklist
    setTimeout(() => {
      if (this.detailContent && this.state.scrollPositions) {
        const savedY = this.state.scrollPositions[`cl_${id}`];
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
    this.state.activeChecklistId = null;
    this.activeTaskId = null;
    this.save();
    this.renderOverview();
  }

  // --- Rendering Overview (Master View) ---
  renderOverview() {
    const all = this.getSortedChecklists(this.state.checklists);
    const pinned = all.filter(c => c.pinned);
    const unpinned = all.filter(c => !c.pinned);

    // Update Counter
    if (this.checklistCounterEl) {
      this.checklistCounterEl.textContent = t('checklistCounter', all.length);
    }

    // Render Pinned Checklists
    if (this.pinnedSectionContainer && this.pinnedListEl) {
      if (pinned.length > 0) {
        this.pinnedSectionContainer.style.display = 'block';
        this.pinnedListEl.innerHTML = pinned.map(cl => this.createChecklistCardHTML(cl)).join('');
      } else {
        this.pinnedSectionContainer.style.display = 'none';
        this.pinnedListEl.innerHTML = '';
      }
    }

    // Render All / Unpinned Checklists
    if (this.allListEl) {
      if (unpinned.length === 0 && pinned.length === 0) {
        this.allListEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
            </div>
            <div class="empty-state-title">${t('noChecklistsYet')}</div>
            <div class="empty-state-sub">${t('noChecklistsSub')}</div>
          </div>
        `;
      } else {
        this.allListEl.innerHTML = unpinned.map(cl => this.createChecklistCardHTML(cl)).join('');
      }
    }

    // Bind click events on checklist cards
    const cards = this.masterView.querySelectorAll('.checklist-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        const id = card.getAttribute('data-id');
        this.openChecklist(id);
      });
    });
  }

  createChecklistCardHTML(cl) {
    const isActive = cl.id === this.state.activeChecklistId;
    
    // Calculate total & completed tasks
    let totalTasks = 0;
    let completedTasks = 0;
    let previewTexts = [];

    if (cl.sections) {
      for (const sec of cl.sections) {
        if (sec.tasks) {
          for (const task of sec.tasks) {
            totalTasks++;
            if (task.completed) completedTasks++;
            if (previewTexts.length < 2 && task.text) {
              previewTexts.push(task.text);
            }
          }
        }
      }
    }

    const preview = previewTexts.length > 0 ? previewTexts.join(' • ') : (cl.sections?.[0]?.title || '');
    const isAllDone = totalTasks > 0 && totalTasks === completedTasks;
    const progressClass = isAllDone ? 'progress-pill completed' : 'progress-pill';
    const relativeTime = formatRelativeDate(cl.updatedAt || cl.createdAt);

    return `
      <div class="checklist-card ${isActive ? 'active' : ''}" data-id="${cl.id}">
        <div class="checklist-card-top">
          <span class="checklist-card-title">${this.escapeHTML(cl.title)}</span>
          ${cl.pinned ? `<span class="pin-badge" title="${t('pinnedChecklists')}"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 9V4l1 0V2H7v2l1 0v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/></svg></span>` : ''}
        </div>
        ${preview ? `<div class="checklist-card-preview">${this.escapeHTML(preview)}</div>` : ''}
        <div class="checklist-card-bottom">
          <span class="${progressClass}">${t('tasksCount', completedTasks, totalTasks)}</span>
          <span class="checklist-card-date">${this.escapeHTML(t('editedRelative', relativeTime))}</span>
        </div>
      </div>
    `;
  }

  // --- Rendering Detail View ---
  renderDetail() {
    const cl = this.getActiveChecklist();
    if (!cl) {
      if (this.detailTitleInput) this.detailTitleInput.value = '';
      if (this.detailTimestampsEl) this.detailTimestampsEl.textContent = '';
      if (this.sectionsContainer) {
        this.sectionsContainer.innerHTML = `
          <div class="empty-state" style="padding-top: 100px;">
            <div class="empty-state-title">${t('appName')}</div>
            <div class="empty-state-sub">${t('selectChecklistPrompt')}</div>
          </div>
        `;
      }
      return;
    }

    if (this.detailTitleInput) {
      this.detailTitleInput.value = cl.title || '';
    }

    // Timestamps: e.g. "Created 09. November 2024 | Edited 10. November 2026 at 16:30"
    if (this.detailTimestampsEl) {
      const createdStr = formatFullDate(cl.createdAt || Date.now());
      const editedDateStr = formatFullDate(cl.updatedAt || Date.now());
      const editedTimeStr = formatTime(cl.updatedAt || Date.now());
      this.detailTimestampsEl.textContent = `${t('createdOn', createdStr)} | ${t('editedOn', editedDateStr, editedTimeStr)}`;
    }

    // Render Sections and tasks
    if (this.sectionsContainer) {
      if (!cl.sections || cl.sections.length === 0) {
        cl.sections = [{ id: generateId('sec'), title: '', tasks: [] }];
      }

      this.sectionsContainer.innerHTML = cl.sections.map((section, sIdx) => `
        <div class="task-section" data-section-id="${section.id}">
          <div class="task-section-header">
            <input type="text" 
                   class="section-title-input" 
                   value="${this.escapeHTML(section.title || '')}" 
                   placeholder="${t('sectionTitlePlaceholder')}"
                   data-section-id="${section.id}">
            ${cl.sections.length > 1 ? `
              <button class="btn-section-delete" data-section-id="${section.id}" title="${t('delete')}">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            ` : ''}
          </div>
          <div class="tasks-container" data-section-id="${section.id}">
            ${(section.tasks && section.tasks.length > 0) ? section.tasks.map(task => this.createTaskItemHTML(task, section.id)).join('') : `
              <div class="empty-state" style="padding: 16px 0 10px 0;">
                <div class="empty-state-sub" style="font-size: 0.85rem;">${t('noTasksInSection')}</div>
              </div>
            `}
          </div>
        </div>
      `).join('');

      this.bindTaskSectionEvents();
    }

    this.updateUndoButtonState();
    this.updateCursorStatus();
  }

  createTaskItemHTML(task, sectionId) {
    const isCompleted = !!task.completed;
    const isCrossed = !!task.crossedOut;
    const isActive = this.activeTaskId === task.id;

    return `
      <div class="task-item ${isCompleted ? 'completed' : ''} ${isCrossed ? 'crossed-out' : ''} ${isActive ? 'active-cursor' : ''}" 
           data-task-id="${task.id}" 
           data-section-id="${sectionId}">
        
        <!-- Swipe Delete Action Background -->
        <div class="task-swipe-action" data-task-id="${task.id}" data-section-id="${sectionId}">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </div>

        <div class="task-content-wrapper">
          <!-- Circular Badge Checkbox -->
          <div class="custom-checkbox" data-task-id="${task.id}" data-section-id="${sectionId}" title="Toggle">
            <svg viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>

          <!-- Task Text Input -->
          <input type="text" 
                 class="task-input" 
                 value="${this.escapeHTML(task.text || '')}" 
                 placeholder="${t('addTaskPlaceholder')}" 
                 data-task-id="${task.id}" 
                 data-section-id="${sectionId}">

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
        const cl = this.getActiveChecklist();
        if (cl) {
          const sec = cl.sections.find(s => s.id === secId);
          if (sec) {
            sec.title = input.value;
            cl.updatedAt = Date.now();
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

    // Task text input events & Cursor Logic
    const taskInputs = this.sectionsContainer.querySelectorAll('.task-input');
    taskInputs.forEach(input => {
      const taskId = input.getAttribute('data-task-id');
      const sectionId = input.getAttribute('data-section-id');

      // Focus: track active cursor
      input.addEventListener('focus', () => {
        this.activeTaskId = taskId;
        this.activeSectionId = sectionId;
        this.highlightActiveTask(taskId);
        this.updateCursorStatus();
      });

      // Text input change
      input.addEventListener('input', () => {
        const cl = this.getActiveChecklist();
        if (cl) {
          const sec = cl.sections.find(s => s.id === sectionId);
          if (sec) {
            const task = sec.tasks.find(t => t.id === taskId);
            if (task) {
              task.text = input.value;
              cl.updatedAt = Date.now();
              this.save();
            }
          }
        }
      });

      // Keydown: Enter creates next task, Backspace on empty deletes task
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
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

    // Swipe-to-delete touch gestures on mobile
    this.bindSwipeGestures();
  }

  highlightActiveTask(taskId) {
    const items = this.sectionsContainer.querySelectorAll('.task-item');
    items.forEach(item => {
      if (item.getAttribute('data-task-id') === taskId) {
        item.classList.add('active-cursor');
      } else {
        item.classList.remove('active-cursor');
      }
    });
  }

  updateCursorStatus() {
    if (!this.cursorStatusPill) return;
    if (this.activeTaskId) {
      this.cursorStatusPill.style.display = 'inline-flex';
      this.cursorStatusPill.textContent = t('cursorNotice');
    } else {
      this.cursorStatusPill.style.display = 'none';
    }
  }

  // --- Task Operations & Cursor Logic ---

  toggleTaskCompleted(sectionId, taskId) {
    this.pushUndoState();
    const cl = this.getActiveChecklist();
    if (!cl) return;
    const sec = cl.sections.find(s => s.id === sectionId);
    if (!sec) return;
    const task = sec.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    cl.updatedAt = Date.now();
    this.save();
    this.renderOverview();
    this.renderDetail();
  }

  crossOutActiveTask() {
    this.pushUndoState();
    const cl = this.getActiveChecklist();
    if (!cl) return;

    let targetTask = null;
    let targetSec = null;

    if (this.activeTaskId) {
      for (const sec of cl.sections) {
        const found = sec.tasks.find(t => t.id === this.activeTaskId);
        if (found) {
          targetTask = found;
          targetSec = sec;
          break;
        }
      }
    }

    if (!targetTask && cl.sections[0]?.tasks.length > 0) {
      targetSec = cl.sections[0];
      targetTask = targetSec.tasks[targetSec.tasks.length - 1];
    }

    if (targetTask) {
      targetTask.crossedOut = !targetTask.crossedOut;
      cl.updatedAt = Date.now();
      this.save();
      this.renderDetail();
      this.showToast(targetTask.crossedOut ? t('crossOutTask') : t('uncrossTask'));
    }
  }

  clearActiveTaskText() {
    this.pushUndoState();
    const cl = this.getActiveChecklist();
    if (!cl || !this.activeTaskId) return;

    for (const sec of cl.sections) {
      const task = sec.tasks.find(t => t.id === this.activeTaskId);
      if (task) {
        task.text = '';
        cl.updatedAt = Date.now();
        this.save();
        this.renderDetail();
        
        // Re-focus the input
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
    const cl = this.getActiveChecklist();
    if (!cl) return;
    const sec = cl.sections.find(s => s.id === sectionId);
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

    cl.updatedAt = Date.now();
    this.activeTaskId = newTask.id;
    this.activeSectionId = sec.id;
    this.save();
    this.renderOverview();
    this.renderDetail();

    // Focus the new task input
    setTimeout(() => {
      const input = this.sectionsContainer.querySelector(`.task-input[data-task-id="${newTask.id}"]`);
      if (input) {
        input.focus();
      }
    }, 50);
  }

  addTaskAtCursorOrBottom() {
    this.pushUndoState();
    const cl = this.getActiveChecklist();
    if (!cl) return;

    if (!cl.sections || cl.sections.length === 0) {
      cl.sections = [{ id: generateId('sec'), title: '', tasks: [] }];
    }

    let targetSection = cl.sections[0];
    if (this.activeSectionId) {
      const found = cl.sections.find(s => s.id === this.activeSectionId);
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

    cl.updatedAt = Date.now();
    this.activeTaskId = newTask.id;
    this.activeSectionId = targetSection.id;
    this.save();
    this.renderOverview();
    this.renderDetail();

    setTimeout(() => {
      const input = this.sectionsContainer.querySelector(`.task-input[data-task-id="${newTask.id}"]`);
      if (input) input.focus();
    }, 50);
  }

  deleteTask(sectionId, taskId) {
    this.pushUndoState();
    const cl = this.getActiveChecklist();
    if (!cl) return;
    const sec = cl.sections.find(s => s.id === sectionId);
    if (!sec) return;

    sec.tasks = sec.tasks.filter(t => t.id !== taskId);
    if (this.activeTaskId === taskId) {
      this.activeTaskId = null;
    }
    cl.updatedAt = Date.now();
    this.save();
    this.renderOverview();
    this.renderDetail();
  }

  deleteTaskAndFocusPrev(sectionId, taskId) {
    const cl = this.getActiveChecklist();
    if (!cl) return;
    const sec = cl.sections.find(s => s.id === sectionId);
    if (!sec) return;

    const curIndex = sec.tasks.findIndex(t => t.id === taskId);
    const prevTask = curIndex > 0 ? sec.tasks[curIndex - 1] : null;

    this.deleteTask(sectionId, taskId);

    if (prevTask) {
      setTimeout(() => {
        const input = this.sectionsContainer.querySelector(`.task-input[data-task-id="${prevTask.id}"]`);
        if (input) {
          input.focus();
          // Move cursor to end of text
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
      }, 50);
    }
  }

  addSection(title) {
    this.pushUndoState();
    const cl = this.getActiveChecklist();
    if (!cl) return;

    const newSec = {
      id: generateId('sec'),
      title: title || '',
      tasks: [{ id: generateId('task'), text: '', completed: false, crossedOut: false }]
    };

    cl.sections.push(newSec);
    cl.updatedAt = Date.now();
    this.save();
    this.renderDetail();

    setTimeout(() => {
      const input = this.sectionsContainer.querySelector(`.task-input[data-section-id="${newSec.id}"]`);
      if (input) input.focus();
    }, 50);
  }

  deleteSection(sectionId) {
    this.pushUndoState();
    const cl = this.getActiveChecklist();
    if (!cl || cl.sections.length <= 1) return;

    cl.sections = cl.sections.filter(s => s.id !== sectionId);
    cl.updatedAt = Date.now();
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
      let currentX = 0;
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

        // If predominantly horizontal swipe to the left
        if (Math.abs(diffX) > Math.abs(diffY) && diffX < 0) {
          isSwiping = true;
          // Apply rubber-band dampening past -80px
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
          // Swipe trigger delete!
          contentWrapper.style.transform = 'translateX(-100%)';
          setTimeout(() => {
            this.deleteTask(sectionId, taskId);
            this.showToast(t('delete'));
          }, 200);
        } else {
          // Reset position
          contentWrapper.style.transform = 'translateX(0)';
        }
      });

      // Also handle direct tap on the red background action
      if (swipeAction) {
        swipeAction.addEventListener('click', () => {
          this.deleteTask(sectionId, taskId);
        });
      }
    });
  }

  // --- Checklist Actions (Pin, Delete, Rename, Duplicate, Clear Completed) ---
  togglePinActiveChecklist() {
    const cl = this.getActiveChecklist();
    if (!cl) return;
    cl.pinned = !cl.pinned;
    cl.updatedAt = Date.now();
    this.save();
    this.renderOverview();
    this.renderDetail();
    this.showToast(cl.pinned ? t('pinnedChecklists') : t('unpin'));
  }

  duplicateActiveChecklist() {
    const cl = this.getActiveChecklist();
    if (!cl) return;

    const duplicated = JSON.parse(JSON.stringify(cl));
    duplicated.id = generateId('cl');
    duplicated.title = `${cl.title} (${t('duplicate')})`;
    duplicated.pinned = false;
    duplicated.createdAt = Date.now();
    duplicated.updatedAt = Date.now();

    // Re-generate IDs for sections and tasks
    if (duplicated.sections) {
      duplicated.sections.forEach(sec => {
        sec.id = generateId('sec');
        if (sec.tasks) {
          sec.tasks.forEach(t => t.id = generateId('task'));
        }
      });
    }

    this.state.checklists.unshift(duplicated);
    this.save();
    this.openChecklist(duplicated.id);
    this.showToast(t('duplicate'));
  }

  clearCompletedActiveChecklist() {
    this.pushUndoState();
    const cl = this.getActiveChecklist();
    if (!cl) return;

    let clearedCount = 0;
    cl.sections.forEach(sec => {
      if (sec.tasks) {
        const remaining = sec.tasks.filter(t => !t.completed);
        clearedCount += (sec.tasks.length - remaining.length);
        sec.tasks = remaining;
      }
    });

    cl.updatedAt = Date.now();
    this.save();
    this.renderOverview();
    this.renderDetail();
    this.showToast(`${clearedCount} ${t('clearCompleted')}`);
  }

  confirmDeleteActiveChecklist() {
    const cl = this.getActiveChecklist();
    if (!cl) return;

    this.showConfirmDialog(
      t('deleteChecklist'),
      t('confirmDeleteChecklist'),
      t('delete'),
      () => {
        this.state.checklists = this.state.checklists.filter(c => c.id !== cl.id);
        this.state.activeChecklistId = this.state.checklists[0]?.id || null;
        this.save();
        this.renderOverview();
        if (window.innerWidth < 860) {
          this.closeDetail();
        } else {
          this.renderDetail();
        }
        this.showToast(t('deleteChecklist'));
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

  // --- Language & Static Translations Update ---
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
        const cl = this.getActiveChecklist();
        if (cl) {
          cl.title = this.detailTitleInput.value;
          cl.updatedAt = Date.now();
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

    // Detail Menu Actions
    document.getElementById('menuItemPin')?.addEventListener('click', () => {
      this.togglePinActiveChecklist();
    });
    document.getElementById('menuItemDuplicate')?.addEventListener('click', () => {
      this.duplicateActiveChecklist();
    });
    document.getElementById('menuItemClearCompleted')?.addEventListener('click', () => {
      this.clearCompletedActiveChecklist();
    });
    document.getElementById('menuItemDelete')?.addEventListener('click', () => {
      this.confirmDeleteActiveChecklist();
    });

    // Main Menu Items
    document.getElementById('menuItemSettings')?.addEventListener('click', () => {
      this.populateSettingsForm();
      this.openModal(this.settingsModal);
    });

    // FAB: Create New Checklist
    if (this.btnFab) {
      this.btnFab.addEventListener('click', () => {
        const input = document.getElementById('newChecklistTitleInput');
        if (input) input.value = '';
        this.openModal(this.newChecklistModal);
        setTimeout(() => input?.focus(), 100);
      });
    }

    // New Checklist Modal
    document.getElementById('btnCreateChecklistConfirm')?.addEventListener('click', () => {
      const input = document.getElementById('newChecklistTitleInput');
      const title = input?.value.trim() || t('newChecklist');
      const newCl = {
        id: generateId('cl'),
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
      this.state.checklists.unshift(newCl);
      this.save();
      this.closeModal(this.newChecklistModal);
      this.openChecklist(newCl.id);
      this.showToast(t('newChecklist'));
    });

    document.getElementById('btnCreateChecklistCancel')?.addEventListener('click', () => {
      this.closeModal(this.newChecklistModal);
    });

    // Bottom Toolbar Actions
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
        if (this.state.activeChecklistId) {
          if (!this.state.scrollPositions) this.state.scrollPositions = {};
          this.state.scrollPositions[`cl_${this.state.activeChecklistId}`] = this.detailContent.scrollTop;
        }
      }, { passive: true });
    }

    // Save on beforeunload
    window.addEventListener('beforeunload', () => {
      this.saveScrollPosition();
    });

    // Listen to OS theme changes if 'system' theme is active
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
    const sortSelect = document.getElementById('settingSortBy');
    const themeSelect = document.getElementById('settingTheme');
    const fontSelect = document.getElementById('settingFontSize');
    const langSelect = document.getElementById('settingLanguage');

    if (sortSelect) sortSelect.value = this.state.settings.sortBy || 'updatedAt_desc';
    if (themeSelect) themeSelect.value = this.state.settings.theme || 'light';
    if (fontSelect) fontSelect.value = this.state.settings.fontSize || 'medium';
    if (langSelect) langSelect.value = this.state.settings.language || 'en';
  }

  bindSettingsEvents() {
    const sortSelect = document.getElementById('settingSortBy');
    const themeSelect = document.getElementById('settingTheme');
    const fontSelect = document.getElementById('settingFontSize');
    const langSelect = document.getElementById('settingLanguage');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const btnExport = document.getElementById('btnExportData');
    const btnImport = document.getElementById('btnImportData');
    const importFileInput = document.getElementById('importFileInput');
    const btnResetAll = document.getElementById('btnResetAllData');

    sortSelect?.addEventListener('change', () => {
      this.state.settings.sortBy = sortSelect.value;
      this.save();
      this.renderOverview();
    });

    themeSelect?.addEventListener('change', () => {
      this.applyTheme(themeSelect.value);
    });

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

        // Ask whether to replace or merge
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
