// js/utils.js - Utility functions

/**
 * Generates a unique ID
 */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Toast Notification System
 */
const Toast = {
  container: null,
  
  init() {
    this.container = document.getElementById('toastContainer');
  },
  
  show(message, actionText = null, actionCallback = null) {
    if (!this.container) this.init();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    
    const textNode = document.createElement('span');
    textNode.textContent = message;
    toast.appendChild(textNode);
    
    let timeoutId;
    
    if (actionText && actionCallback) {
      const btn = document.createElement('button');
      btn.textContent = actionText;
      btn.onclick = () => {
        actionCallback();
        this.dismiss(toast, timeoutId);
      };
      toast.appendChild(btn);
    }
    
    this.container.appendChild(toast);
    
    // Auto dismiss after 5 seconds
    timeoutId = setTimeout(() => {
      this.dismiss(toast);
    }, 5000);
  },
  
  dismiss(toast, timeoutId) {
    if (timeoutId) clearTimeout(timeoutId);
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode === this.container) {
        this.container.removeChild(toast);
      }
    }, 300); // Matches transition time
  }
};

/**
 * Theme Management
 */
const ThemeManager = {
  init() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('taskflow_theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const currentTheme = savedTheme || (systemDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    toggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('taskflow_theme', newTheme);
    });
  }
};

/**
 * Natural Language Date Parsing
 */
function parseNLP(text) {
  const lower = text.toLowerCase();
  let dueDate = null;
  let cleanText = text;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  if (lower.includes(' tomorrow')) {
    dueDate = tomorrow.toISOString().split('T')[0];
    cleanText = text.replace(/ tomorrow/i, '');
  } else if (lower.includes(' today')) {
    dueDate = today.toISOString().split('T')[0];
    cleanText = text.replace(/ today/i, '');
  } else if (lower.includes(' next week')) {
    dueDate = nextWeek.toISOString().split('T')[0];
    cleanText = text.replace(/ next week/i, '');
  }

  return { cleanText, dueDate };
}

