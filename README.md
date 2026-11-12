# Checklists PWA

A lightning-fast, offline-capable Checklists web application built for iPhone (PWA) and Desktop/Laptop.

![Checklists Banner](assets/icons/logo.png)

## Overview

**Checklists** is a Web Application & Progressive Web App (PWA) for Orginazing your Tasks. It provides a native-app experience (optimized for iOS "Add to Home Screen" fullscreen mode) as well as an adaptive widescreen layout for laptops and desktops.

---

## Key Features

### Dual-Mode Responsive Experience
- **Mobile (iPhone / iOS PWA):**
  - Single-column master-detail workflow with smooth navigation transitions.
  - Safe area inset handling (`viewport-fit=cover`, `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
  - Touch gestures including **Swipe Left to Delete** on task rows.
  - Fullscreen standalone mode without Safari URL bar when added to Home Screen.
- **Laptop & Desktop:**
  - Adaptive 2-column widescreen view: Sidebar overview on the left and full task management on the right.
  - Automatically adapts to large monitors and widescreen laptops instead of a stretched mobile interface.

### Task Management
- **Circular Checkmark Badge:** High-finish circular badge in `#f5b914` with a crisp white checkmark (`✓`) when completed.
- **Day / Section Grouping:** Organize tasks into days or custom sections (e.g. `Montag:`, `Mittwoch:`, `Wochenende:`).
- **Task Editing:** Edit task text directly on desktop. On mobile, tap a task to select it, then use the **T** button to edit; tapping task text alone won’t place a cursor.
- **Mobile Task Deletion:** Swipe a task left to reveal its delete button; it is removed only when you tap the trash icon.
- **Undo Engine:** A dedicated top-toolbar curved arrow button (and `Ctrl+Z` / `Cmd+Z`) lets you revert checklist edits, toggles, and deletions in real time.

### Pinned Checklists & Organization
- Pin important checklists to keep them top-of-mind in a dedicated pinned section.
- Automatic metadata tracking: Created timestamps and relative edit times (e.g., *edited Yesterday*, *bearbeitet vor 2 Stunden*).
- Multiple sort options: Date Edited, Date Created, Alphabetical (A-Z), and Default / Manual.

---

## Installing as a PWA

### On iPhone / iPad (iOS Safari)
1. Open the website in Safari.
2. Tap the **Share** button (box with upward arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Confirm by tapping **Add**. The app will launch in standalone fullscreen mode just like a native app.

### On Mac, Windows & Android (Chrome / Edge / Safari)
1. Visit the app URL in your browser.
2. Look for the **Install** icon in the address bar (or menu > *Install Checklists*).
3. Click **Install** to add Checklists to your desktop or app drawer.

---

## License

This project is open-source under the [MIT License](LICENSE).
