// js/main.js - Application Initialization

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Utilities
  ThemeManager.init();
  Toast.init();

  // Initialize State
  State.init();

  // Initialize Render
  Render.init();

  // Initialize Events
  Events.init();

  // Initial Render
  Render.renderApp();

  // Check if no tasks exist, show a welcome toast
  if (State.tasks.length === 0) {
    setTimeout(() => {
      Toast.show('Welcome to TaskFlow! Add your first task.');
    }, 500);
  }
});
