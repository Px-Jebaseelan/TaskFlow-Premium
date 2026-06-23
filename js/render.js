// js/render.js - Core UI Rendering

const Render = {
  elements: {
    taskList: null,
    emptyState: null,
    totalCount: null,
    completedCount: null,
    pendingCount: null,
    progressBar: null,
    filterChips: null,
    viewToggles: null
  },
  
  init() {
    this.elements.taskList = document.getElementById('taskList');
    this.elements.emptyState = document.getElementById('emptyState');
    this.elements.totalCount = document.getElementById('totalCount');
    this.elements.completedCount = document.getElementById('completedCount');
    this.elements.pendingCount = document.getElementById('pendingCount');
    this.elements.progressBar = document.getElementById('progressBar');
    this.elements.filterChips = document.querySelectorAll('.nav-item');
    this.elements.viewToggles = document.querySelectorAll('.view-toggles .icon-btn');
  },
  
  renderApp() {
    if (!this.elements.taskList) this.init();
    
    const tasksToRender = State.getFilteredAndSortedTasks();
    const stats = State.getStats();
    
    this.elements.totalCount.textContent = stats.total;
    this.elements.completedCount.textContent = stats.completed;
    this.elements.pendingCount.textContent = stats.pending;
    this.elements.progressBar.style.width = `${stats.percent}%`;
    
    this.elements.filterChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filter === State.filters.status);
    });

    this.elements.viewToggles.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === State.filters.view);
    });
    
    if (tasksToRender.length === 0) {
      this.elements.taskList.innerHTML = '';
      this.elements.emptyState.classList.remove('hidden');
      return;
    }
    this.elements.emptyState.classList.add('hidden');
    
    if (State.filters.view === 'board') {
      this.renderBoardView(tasksToRender);
    } else {
      this.renderListView(tasksToRender);
    }
  },

  renderTaskItemHTML(task, now) {
    let dueLabel = '';
    let isOverdue = false;
    if (task.dueDate) {
      const taskDate = new Date(task.dueDate).setHours(0,0,0,0);
      const diffDays = Math.round((taskDate - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0 && !task.completed) {
        dueLabel = 'Overdue';
        isOverdue = true;
      } else if (diffDays === 0) { dueLabel = 'Today'; } 
      else if (diffDays === 1) { dueLabel = 'Tomorrow'; } 
      else { dueLabel = new Date(task.dueDate).toLocaleDateString(); }
    }

    const subtasksHTML = (task.subtasks || []).map((st, i) => `
      <div class="subtask-item">
        <input type="checkbox" data-action="toggle-subtask" data-index="${i}" ${st.completed ? 'checked' : ''}>
        <span class="${st.completed ? 'subtask-done' : ''}">${escapeHTML(st.text)}</span>
      </div>
    `).join('');

    return `
      <div class="task-checkbox-container">
        <input type="checkbox" class="task-checkbox" aria-label="Mark task complete" data-action="toggle" ${task.completed ? 'checked' : ''} ${task.dependsOn && !task.completed ? 'disabled title="Depends on another task"' : ''}>
      </div>
      <div class="task-content">
        <div class="task-text" data-action="edit-start" title="Click to edit">${escapeHTML(task.text)}</div>
        <div class="task-badges">
          <span class="badge category-${task.category}">${task.category}</span>
          ${dueLabel ? `<span class="badge ${isOverdue ? 'overdue' : ''}">Due: ${dueLabel}</span>` : ''}
          ${task.recurring && task.recurring !== 'none' ? `<span class="badge">🔁 ${task.recurring}</span>` : ''}
        </div>
        ${task.notes ? `<div class="task-notes">${escapeHTML(task.notes)}</div>` : ''}
        ${task.subtasks && task.subtasks.length > 0 ? `<div class="task-subtasks">${subtasksHTML}</div>` : ''}
      </div>
      <div class="task-actions">
        <button class="icon-btn" data-action="ai-breakdown" title="AI Breakdown" aria-label="AI Breakdown">✨</button>
        <button class="icon-btn" data-action="delete" aria-label="Delete task">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;
  },

  renderListView(tasksToRender) {
    const df = document.createDocumentFragment();
    const now = new Date().setHours(0,0,0,0);
    
    // Reset to list format if changed
    this.elements.taskList.className = 'task-list';

    tasksToRender.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.dataset.id = task.id;
      li.dataset.priority = task.priority;
      li.setAttribute('draggable', 'true');
      li.innerHTML = this.renderTaskItemHTML(task, now);
      df.appendChild(li);
    });
    
    this.elements.taskList.innerHTML = '';
    this.elements.taskList.appendChild(df);
  },

  renderBoardView(tasksToRender) {
    const now = new Date().setHours(0,0,0,0);
    
    // Switch to board format
    this.elements.taskList.className = 'kanban-board';
    this.elements.taskList.innerHTML = `
      <div class="kanban-col">
        <h3>Pending</h3>
        <ul class="kanban-col-list" data-status="pending"></ul>
      </div>
      <div class="kanban-col">
        <h3>Completed</h3>
        <ul class="kanban-col-list" data-status="completed"></ul>
      </div>
    `;

    const pendingUl = this.elements.taskList.querySelector('[data-status="pending"]');
    const completedUl = this.elements.taskList.querySelector('[data-status="completed"]');

    tasksToRender.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item kanban-card ${task.completed ? 'completed' : ''}`;
      li.dataset.id = task.id;
      li.dataset.priority = task.priority;
      li.setAttribute('draggable', 'true');
      li.innerHTML = this.renderTaskItemHTML(task, now);
      
      if (task.completed) {
        completedUl.appendChild(li);
      } else {
        pendingUl.appendChild(li);
      }
    });
  },

  renderInlineEdit(id, currentText) {
    const li = this.elements.taskList.querySelector(`li[data-id="${id}"]`);
    if (!li) return;
    
    const contentDiv = li.querySelector('.task-content');
    const textDiv = li.querySelector('.task-text');
    
    if (!textDiv) return;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-text-input';
    input.value = currentText;
    
    contentDiv.replaceChild(input, textDiv);
    input.focus();
  }
};

window.renderApp = () => Render.renderApp();
