# Checklists PWA

A lightning-fast, offline-capable Checklists web application built for iPhone (PWA) and Desktop/Laptop.

![Checklists Banner](assets/icons/logo.png)

## Overview

**Checklists** is a production-ready, highly polished, fully responsive Web Application & Progressive Web App (PWA). It provides a seamless native-app experience on iPhone (optimized for iOS "Add to Home Screen" fullscreen mode) as well as an adaptive, multi-column widescreen layout for laptops and desktops.

- **App Name:** Checklists v1.0.0
- **Data Persistence:** 100% client-side `localStorage` with manual JSON Export and Import capabilities.
- **Languages:** Fully bilingual (English and German), switchable instantly in settings.
- **Design Identity:** Clean, modern UI featuring the primary brand color `#ffc114`, very light gray backgrounds (`#f4f5f7`), crisp white cards (`#ffffff`), and global typography set to **Bierstadt** (with standard sans-serif fallbacks).
- **Deployment Readiness:** Pre-configured for instant zero-config deployment on **GitHub Pages**.

---

## Key Features

### 1. Dual-Mode Responsive Experience
- **Mobile (iPhone / iOS PWA):**
  - Single-column master-detail workflow with smooth navigation transitions.
  - Safe area inset handling (`viewport-fit=cover`, `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
  - Touch gestures including **Swipe Left to Delete** on task rows.
  - Fullscreen standalone mode without Safari URL bar when added to Home Screen.
- **Laptop & Desktop:**
  - Adaptive 2-column widescreen view: Sidebar overview on the left and full task management on the right.
  - Automatically adapts to large monitors and widescreen laptops instead of a stretched mobile interface.

### 2. Task Management & Cursor Logic
- **Circular Checkmark Badge:** High-finish circular badge in `#ffc114` with a crisp white checkmark (`✓`) when completed.
- **Day / Section Grouping:** Organize tasks into days or custom sections (e.g. `Montag:`, `Mittwoch:`, `Wochenende:`).
- **Cursor Logic:** When a task row has focus, editing actions (e.g. **Cross Out**, **Clear Text `""`**, or **Add Task**) automatically target the cursor position. Pressing `Enter` creates a new item directly beneath the current task line; `Backspace` on an empty line removes it and returns focus to the preceding task.
- **Undo Engine:** A dedicated top-toolbar curved arrow button (and `Ctrl+Z` / `Cmd+Z`) lets you revert checklist edits, toggles, and deletions in real time.

### 3. Pinned Checklists & Organization
- Pin important checklists to keep them top-of-mind in a dedicated pinned section.
- Automatic metadata tracking: Created timestamps and relative edit times (e.g., *edited Yesterday*, *bearbeitet vor 2 Stunden*).
- Multiple sort options: Date Edited, Date Created, Alphabetical (A-Z), and Default / Manual.

### 4. Settings & 100% Client-Side Privacy
- **Dark Mode:** Seamless toggle between Light, Dark, and System Auto appearance.
- **Font Sizing:** Customizable font scaling (Small, Medium, Large, Extra Large).
- **Language Switcher:** Instant toggle between English and Deutsch (German).
- **Backup & Restore:** Full manual JSON state export and import (with merge or replace options).
- **Factory Reset:** One-click complete erase of local data protected by confirmation dialogues.
- **Zero Tracking:** 100% local in the browser—no third-party tracking, no cookies, no accounts required.

---

## Directory Structure

```plaintext
checklists-webapp/
├── .gitignore
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── manifest.json
├── sw.js
├── index.html
├── assets/
│   ├── css/
│   │   └── main.css
│   └── js/
│       ├── app.js
│       ├── storage.js
│       ├── ui.js
│       └── i18n.js
└── assets/icons/
    ├── icon-192.png
    ├── icon-512.png
    └── logo.png
```

---

## Getting Started Locally

Because the application is built using vanilla ES6+ modules, it runs in any modern browser without complex build steps:

1. Clone or download this repository:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   ```

2. Start a local HTTP server (required for ES6 modules & Service Worker):
   - With Node.js:
     ```bash
     npx serve .
     ```
   - Or with Python 3:
     ```bash
     python -m http.server 8000
     ```

3. Open your browser and navigate to `http://localhost:8000` (or the port specified).

---

## Deploying to GitHub Pages

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Checklists PWA v1.0.0"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

2. Go to your repository on GitHub:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select branch `main` and folder `/ (root)`.
   - Click **Save**.

Your Checklists PWA will be live in minutes at `https://<your-username>.github.io/<repo-name>/`.

---

## Installing as a PWA

### On iPhone / iPad (iOS Safari)
1. Open the deployed website in Safari.
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
