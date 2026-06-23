# TaskFlow

## 1. Overview
TaskFlow is a production-grade, futuristic, and professional To-Do application built to showcase solid front-end engineering fundamentals. Instead of relying on heavy frameworks, it is built entirely with semantic HTML, CSS, and vanilla JavaScript. It manages to deliver a rich user experience—featuring drag-and-drop, theme toggling, inline editing, and a robust undo system—all within a dependency-free, highly performant client-side architecture.

## 2. Feature List

### Core (Required)
- **Add Task:** Enter key or button submission with empty-input guards.
- **Display Tasks:** Rendered list, defaulting to newest-first.
- **Mark Complete:** Checkbox with strikethrough and visual dimming.
- **Edit Task:** Inline editing for a native, seamless feel.
- **Delete Task:** Smooth removal paired with a non-blocking undo system instead of an intrusive `confirm()`.
- **Search:** Live, filter-as-you-type, case-insensitive text matching.
- **Counters:** Live-updating Total, Completed, and Pending counts.
- **Responsive:** Mobile-first design scaling elegantly across 3 breakpoints.

### Enhancements
- **Priority Levels:** Low, Medium, High—visually indicated via a left-border accent.
- **Due Dates:** Native date picker with smart relative labels ("Today", "Tomorrow", "Overdue").
- **Categories:** Work, Personal, Study, Other tags displayed as pills.
- **Filter Chips:** Instant views for All, Active, Completed, and Overdue tasks.
- **Sort Options:** Multiple sorting parameters including Newest, Oldest, Priority, Due Date, and A-Z.
- **Drag-to-Reorder:** HTML5 native drag-and-drop for tactile manual prioritization.
- **Undo Delete:** A 5-second toast notification allowing restoration of mistakenly deleted tasks.
- **Persistent Storage:** Data survives refreshes via `localStorage`.
- **Progress Bar:** Visual completion percentage.
- **Empty States:** Designed fallbacks when no tasks exist or searches yield no results.
- **Theme Toggle:** Light/Dark mode respecting system preferences.
- **Keyboard-First UX:** Intuitive shortcuts like `/` to search and `Esc` to cancel edits.
- **Micro-Animations:** Smooth, CSS-only transitions without library bloat.
- **Data Export/Import:** JSON serialization to export and backup tasks.

## 3. Tech Stack & Why
- **Vanilla JavaScript (ES6+):** No dependencies, frameworks, or build tools. This ensures the codebase is fully explainable, performs exceptionally fast, and demonstrates a strong grasp of core JavaScript mechanics over framework abstractions.
- **CSS Custom Properties (Variables):** Allows for scalable theming (Light/Dark mode) and consistent spacing/typography without requiring a preprocessor like Sass.
- **`localStorage`:** Provides client-side persistence, eliminating the need for a backend while maintaining the feel of a full product.

## 4. Data Model
State is managed via a single source of truth—the `tasks` array. Each task is an object with the following shape:
```json
{
  "id": "e4f8d2a1-...", // Unique string generated via crypto.randomUUID()
  "text": "Finish assignment", // String: The actual task content
  "completed": false, // Boolean: Toggled state
  "priority": "medium", // String: 'low' | 'medium' | 'high'
  "category": "study", // String: 'personal' | 'work' | 'study' | 'other'
  "dueDate": "2026-06-25", // String (YYYY-MM-DD) or null
  "createdAt": 1719... // Integer: Timestamp for chronological sorting
}
```

## 5. Architecture Walkthrough
The application strictly enforces a unidirectional data flow to prevent UI/state drift:
1. **User Action:** A user interacts with the UI (e.g., clicks "Add", "Complete", or "Delete").
2. **State Mutation:** The corresponding function in `state.js` modifies the `State.tasks` array.
3. **Persistence:** `State.saveTasks()` immediately commits the new state to `localStorage`.
4. **Render:** `Render.renderApp()` is called. This function calculates derived states (counters, progress, filters, sorts) and completely redraws the DOM `<ul>` from scratch.

*Note: The render function is the ONLY entity allowed to touch the task list DOM.*
Event listeners are attached via **Event Delegation** on the parent `<ul>`, which ensures that dynamically added tasks do not require individual event bindings.

## 6. CSS System
The visual language ("futuristic but professional") is achieved through:
- **CSS Variables:** Centralized tokens in `:root` for colors, spacing (`--space-1` to `--space-6`), and border-radii.
- **Glassmorphism:** Subtle `backdrop-filter: blur()` applied to cards to provide depth.
- **Mobile-First:** Base styles target mobile devices, progressively enhancing layout complexity for tablets (`min-width: 600px`) and desktops (`min-width: 1024px`).
- **Theme Switching:** Modifying the `data-theme` attribute on the `<html>` tag seamlessly cascades new color variables across the application.

## 7. Known Limitations
- **Local Scope:** Data is bound to the specific browser and device (no cloud sync).
- **Single User:** No authentication or multi-user support.
- **Performance:** While extremely fast for typical usage (hundreds of tasks), completely rebuilding the DOM in `renderApp()` may bottleneck if scaling to 10,000+ tasks without implementing virtualization or diffing.

## 8. Possible Future Work
- Backend integration (REST or GraphQL API) for cross-device syncing.
- Push notifications or email reminders via Service Workers.
- Recurring task configurations.
- Collaborative sharing of task lists.

## 9. FAQ / Engineering Decisions

**Q: Why didn't you use a framework like React or Vue?**
A: Given the scope of a CRUD To-Do app, the overhead of a virtual DOM and build pipeline is unnecessary. A robust Vanilla JS architecture—with a single render function and state isolation—achieves the same predictability with zero dependencies and a smaller footprint.

**Q: How is the completed state styled?**
A: Completing a task toggles a `completed` boolean in the data model. During the next render cycle, this adds a `.completed` CSS class to the specific `<li>`, which applies a lower opacity and a strikethrough effect via CSS, keeping logic and presentation strictly separated.

**Q: Walk me through what happens when I click delete.**
A: The click event bubbles up to the parent `<ul>` (event delegation). The handler reads the `data-id` of the task and calls `State.deleteTask(id)`. The task is removed from the active array but cached in memory. `State.saveTasks()` syncs `localStorage` and triggers a re-render. Simultaneously, `Toast.show()` displays an "Undo" button which, if clicked, re-inserts the cached task at its original index and triggers another render.

**Q: How would you scale this to 10,000 tasks?**
A: I would introduce DOM virtualization (rendering only the visible items) and optimize the render cycle by patching the DOM (only updating changed nodes) instead of relying on `innerHTML` resets. Furthermore, data pagination would be required.

## 10. Setup Instructions
TaskFlow is completely buildless.
1. Clone or download the repository.
2. Open `index.html` in any modern web browser.
3. Enjoy!
