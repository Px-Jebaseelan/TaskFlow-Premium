// js/state.js - State management and Data manipulations

const State = {
  tasks: [],
  filters: {
    search: '',
    status: 'all', // all | active | completed | overdue
    sort: 'newest', // newest | oldest | priority | due-date | alpha
    view: 'list' // list | board
  },
  
  // Undo cache
  lastDeletedTask: null,
  lastDeletedIndex: -1,
  
  init() {
    this.loadTasks();
  },
  
  loadTasks() {
    try {
      const saved = localStorage.getItem('taskflow_tasks');
      if (saved) {
        this.tasks = JSON.parse(saved);
      } else {
        this.tasks = [];
      }
    } catch (e) {
      console.error('Failed to load tasks:', e);
      this.tasks = [];
    }
  },
  
  saveTasks() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
    // Re-render implicitly expected by whoever calls mutations, usually main.js
    if (typeof window.renderApp === 'function') {
      window.renderApp();
    }
  },
  
  addTask(text, priority, category, dueDate, recurring = 'none', dependsOn = null) {
    const newTask = {
      id: generateId(),
      text: text.trim(),
      notes: '',
      subtasks: [],
      completed: false,
      priority: priority || 'medium',
      category: category || 'other',
      dueDate: dueDate || null,
      recurring: recurring, // 'none', 'daily', 'weekly', 'monthly'
      dependsOn: dependsOn, // id of another task
      createdAt: Date.now()
    };
    
    this.tasks.push(newTask);
    this.saveTasks();
    Toast.show('Task added successfully.');
    return newTask;
  },
  
  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      // Check dependencies
      if (task.dependsOn) {
        const depTask = this.tasks.find(t => t.id === task.dependsOn);
        if (depTask && !depTask.completed && !task.completed) {
          Toast.show('Cannot complete: Waiting on a prerequisite task.', null, null, 'warning');
          return;
        }
      }

      task.completed = !task.completed;
      
      // Handle recurring if just completed
      if (task.completed && task.recurring && task.recurring !== 'none') {
        this.handleRecurring(task);
      }
      
      this.saveTasks();
      
      // Check for zero-inbox completion
      if (this.tasks.length > 0 && this.tasks.every(t => t.completed)) {
        Toast.show('🎉 All tasks completed! Great job!');
      }
    }
  },
  
  handleRecurring(task) {
    if (!task.dueDate) return;
    const oldDate = new Date(task.dueDate);
    let newDate = new Date(oldDate);
    
    if (task.recurring === 'daily') newDate.setDate(oldDate.getDate() + 1);
    else if (task.recurring === 'weekly') newDate.setDate(oldDate.getDate() + 7);
    else if (task.recurring === 'monthly') newDate.setMonth(oldDate.getMonth() + 1);
    
    const newTask = {
      ...task,
      id: generateId(),
      completed: false,
      dueDate: newDate.toISOString().split('T')[0],
      createdAt: Date.now()
    };
    this.tasks.push(newTask);
    Toast.show(`Recurring task generated for ${newTask.dueDate}.`);
  },
  
  deleteTask(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      // Cache for undo
      this.lastDeletedTask = this.tasks[index];
      this.lastDeletedIndex = index;
      
      this.tasks.splice(index, 1);
      this.saveTasks();
      
      Toast.show('Task deleted.', 'Undo', () => this.undoDelete());
    }
  },
  
  undoDelete() {
    if (this.lastDeletedTask !== null) {
      // Insert back at original index or end
      const index = Math.min(this.lastDeletedIndex, this.tasks.length);
      this.tasks.splice(index, 0, this.lastDeletedTask);
      
      // Clear cache
      this.lastDeletedTask = null;
      this.lastDeletedIndex = -1;
      
      this.saveTasks();
      Toast.show('Task restored.');
    }
  },
  
  editTask(id, newText) {
    const task = this.tasks.find(t => t.id === id);
    if (task && newText.trim().length > 0) {
      task.text = newText.trim();
      this.saveTasks();
    }
  },

  updateTaskExtra(id, updates) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates);
      this.saveTasks();
    }
  },

  reorderTasks(draggedId, targetId) {
    if (draggedId === targetId) return;
    
    const dragIndex = this.tasks.findIndex(t => t.id === draggedId);
    const targetIndex = this.tasks.findIndex(t => t.id === targetId);
    
    if (dragIndex !== -1 && targetIndex !== -1) {
      const [draggedTask] = this.tasks.splice(dragIndex, 1);
      this.tasks.splice(targetIndex, 0, draggedTask);
      this.saveTasks();
    }
  },
  
  // Filtering & Sorting computations
  getFilteredAndSortedTasks() {
    let result = [...this.tasks];
    const now = new Date().setHours(0,0,0,0);
    
    // 1. Search Filter
    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      result = result.filter(t => t.text.toLowerCase().includes(q));
    }
    
    // 2. Status Filter
    if (this.filters.status === 'active') {
      result = result.filter(t => !t.completed);
    } else if (this.filters.status === 'completed') {
      result = result.filter(t => t.completed);
    } else if (this.filters.status === 'overdue') {
      result = result.filter(t => {
        if (t.completed || !t.dueDate) return false;
        const taskDate = new Date(t.dueDate).setHours(0,0,0,0);
        return taskDate < now;
      });
    }
    
    // 3. Sorting
    result.sort((a, b) => {
      switch (this.filters.sort) {
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'priority':
          const pVals = { high: 3, medium: 2, low: 1 };
          return pVals[b.priority] - pVals[a.priority];
        case 'due-date':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'alpha':
          return a.text.localeCompare(b.text);
        case 'newest':
        default:
          return b.createdAt - a.createdAt;
      }
    });
    
    return result;
  },

  getStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    return { total, completed, pending, percent };
  }
};
