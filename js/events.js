// js/events.js - Event Listeners and Handlers

const Events = {
  draggedItemId: null,

  init() {
    this.bindFormEvents();
    this.bindTaskListEvents();
    this.bindControlEvents();
    this.bindDataEvents();
  },

  bindFormEvents() {
    const form = document.getElementById('taskForm');
    const input = document.getElementById('taskInput');
    const priority = document.getElementById('taskPriority');
    const category = document.getElementById('taskCategory');
    const dueDate = document.getElementById('taskDueDate');
    const recurring = document.getElementById('taskRecurring');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!input.value.trim()) return;

      const { cleanText, dueDate: nlpDate } = parseNLP(input.value);
      const finalDate = dueDate.value || nlpDate;

      State.addTask(cleanText, priority.value, category.value, finalDate, recurring.value);
      
      input.value = '';
      dueDate.value = '';
      input.focus();
    });

    const btnMagicAdd = document.getElementById('btnMagicAdd');
    if (btnMagicAdd) {
      btnMagicAdd.addEventListener('click', async () => {
        if (!input.value.trim()) return;
        btnMagicAdd.textContent = '✨...';
        
        const { cleanText, dueDate: nlpDate } = parseNLP(input.value);
        const auto = await GroqAI.autoCategorize(cleanText);
        
        let p = priority.value;
        let c = category.value;
        if (auto) {
          if (auto.priority) p = auto.priority;
          if (auto.category) c = auto.category;
          Toast.show(`AI set priority to ${p} and category to ${c}`);
        }
        
        State.addTask(cleanText, p, c, dueDate.value || nlpDate, recurring.value);
        
        input.value = '';
        dueDate.value = '';
        btnMagicAdd.textContent = '✨ Magic Add';
        input.focus();
      });
    }
  },

  bindTaskListEvents() {
    const taskList = document.getElementById('taskList');

    // Event Delegation for Task Actions
    taskList.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const li = target.closest('li[data-id]');
      if (!li) return;
      const id = li.dataset.id;
      const action = target.dataset.action;

      if (action === 'toggle') {
        State.toggleTask(id);
      } else if (action === 'delete') {
        State.deleteTask(id);
      } else if (action === 'edit-start') {
        const textDiv = li.querySelector('.task-text');
        if (textDiv) {
          Render.renderInlineEdit(id, textDiv.textContent);
        }
      } else if (action === 'ai-breakdown') {
        GroqAI.breakdownTask(id);
      } else if (action === 'toggle-subtask') {
        const subIndex = parseInt(target.dataset.index, 10);
        const task = State.tasks.find(t => t.id === id);
        if (task && task.subtasks && task.subtasks[subIndex]) {
          task.subtasks[subIndex].completed = !task.subtasks[subIndex].completed;
          State.saveTasks();
        }
      }
    });

    // Handle Inline Edit completion (blur and enter key)
    taskList.addEventListener('focusout', (e) => {
      if (e.target.classList.contains('task-text-input')) {
        const li = e.target.closest('li[data-id]');
        if (li) {
          State.editTask(li.dataset.id, e.target.value);
          Render.renderApp(); // Force re-render if empty or unchanged
        }
      }
    });

    taskList.addEventListener('keydown', (e) => {
      if (e.target.classList.contains('task-text-input')) {
        if (e.key === 'Enter') {
          e.target.blur(); // Triggers focusout
        } else if (e.key === 'Escape') {
          Render.renderApp(); // Cancel edit
        }
      }
    });

    // Drag and Drop (HTML5 Native)
    taskList.addEventListener('dragstart', (e) => {
      const li = e.target.closest('li[data-id]');
      if (li) {
        this.draggedItemId = li.dataset.id;
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Required for Firefox
        e.dataTransfer.setData('text/plain', li.dataset.id);
      }
    });

    taskList.addEventListener('dragend', (e) => {
      const li = e.target.closest('li[data-id]');
      if (li) {
        li.classList.remove('dragging');
        this.draggedItemId = null;
      }
    });

    taskList.addEventListener('dragover', (e) => {
      e.preventDefault(); // Necessary to allow dropping
      const targetLi = e.target.closest('li[data-id]');
      if (targetLi && targetLi.dataset.id !== this.draggedItemId) {
        // Find center of target to decide inserting before or after, 
        // for simplicity we will just do a reorder action on drop.
        e.dataTransfer.dropEffect = 'move';
      }
    });

    taskList.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetLi = e.target.closest('li[data-id]');
      if (targetLi && this.draggedItemId && targetLi.dataset.id !== this.draggedItemId) {
        State.reorderTasks(this.draggedItemId, targetLi.dataset.id);
      }
    });
  },

  bindControlEvents() {
    const searchInput = document.getElementById('cmdInput'); // We'll just bind search to cmdInput
    const sortSelect = document.getElementById('sortSelect');
    const viewToggles = document.querySelectorAll('.view-toggles .icon-btn');
    const navItems = document.querySelectorAll('.nav-item');

    // Global keyboard shortcuts (Cmd+K and /)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const cp = document.getElementById('cmdPalette');
        cp.classList.toggle('hidden');
        if (!cp.classList.contains('hidden')) {
          searchInput.focus();
        }
      }
      if (e.key === 'Escape') {
        const cp = document.getElementById('cmdPalette');
        if (cp && !cp.classList.contains('hidden')) {
          cp.classList.add('hidden');
          if (searchInput) {
            searchInput.value = '';
            State.filters.search = '';
            Render.renderApp();
          }
        } else if (document.body.classList.contains('focus-mode')) {
          document.body.classList.remove('focus-mode');
          const focusToggle = document.getElementById('focusToggle');
          if (focusToggle) focusToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg> Zen Mode';
          Toast.show('Zen Mode deactivated.');
        }
      }
    });

    viewToggles.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        State.filters.view = view;
        Render.renderApp();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        State.filters.search = e.target.value;
        Render.renderApp();
      });
    }

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        navItems.forEach(n => n.classList.remove('active'));
        e.currentTarget.classList.add('active');
        State.filters.status = e.currentTarget.dataset.filter;
        Render.renderApp();
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        State.filters.sort = e.target.value;
        Render.renderApp();
      });
    }

    const focusToggle = document.getElementById('focusToggle');
    if (focusToggle) {
      focusToggle.addEventListener('click', () => {
        document.body.classList.toggle('focus-mode');
        const isActive = document.body.classList.contains('focus-mode');
        focusToggle.innerHTML = isActive 
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h6v6"></path><path d="M20 10h-6V4"></path><path d="M14 10l7-7"></path><path d="M3 21l7-7"></path></svg> Exit Zen' 
          : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg> Zen Mode';
        
        Toast.show(isActive ? 'Zen Mode activated. Press ESC to exit.' : 'Zen Mode deactivated.');
      });
    }
  },

  bindDataEvents() {
    const exportBtn = document.getElementById('exportBtn');
    const importInput = document.getElementById('importInput');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(State.tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'taskflow-backup.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        Toast.show('Tasks exported successfully.');
      });
    }

    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedTasks = JSON.parse(event.target.result);
            if (Array.isArray(importedTasks)) {
              State.tasks = importedTasks;
              State.saveTasks(); // Will trigger render
              Toast.show('Tasks imported successfully.');
            } else {
              throw new Error('Invalid format');
            }
          } catch (err) {
            Toast.show('Failed to import tasks. Invalid JSON.');
          }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again
        e.target.value = '';
      });
    }
  }
};
