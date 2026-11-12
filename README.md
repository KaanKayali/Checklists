<div align="center">

# Checklists

**A simple, fast, offline-ready app for your to-do lists.**<br>
For phones, tablets, laptops, and desktop computers.

<img src="assets/icons/brand-logo.png" alt="Checklists logo" height="88">

![Version](https://img.shields.io/badge/version-1.0.0-ffc114?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-installable-4c8c69?style=flat-square)

<br>

| App language options | Availability |
|:--|:--|
| English | Selectable in the app |
| German (Deutsch) | Selectable in the app |

</div>

---

### About

**Checklists** is a responsive web app and Progressive Web App (PWA) for creating and organizing to-do lists. It is designed to feel at home on a phone, tablet, laptop, or desktop, and can be installed for a convenient app-like experience.

I mainly made this app for myself: a straightforward place to organize everyday tasks, with the features and look I wanted. The app's interface language can be selected in the project: English or German.

> **Current app version: 1.0.0**

### Features

#### One app for mobile and desktop
- **Mobile (including iPhone and iOS PWA):** A focused, single-column board and task view with smooth navigation.
- **iPhone layout details:** Safe-area insets keep content clear of the screen edges, and navigation transitions smoothly between the board overview and a selected board.
- **Touch-friendly controls:** Swipe a task left to reveal its delete button, and press and hold tasks or section grips to reorder them.
- **Installable experience:** Add the app to your iPhone or iPad Home Screen for standalone fullscreen use.
- **Laptop and desktop:** An adaptive two-column layout shows the board overview alongside task management.

#### Task management
- **Boards and sections:** Group tasks into days or custom sections such as `Monday`, `Wednesday`, `Weekend`, or `In school`.
- **Task editing:** Edit task text directly on desktop. On mobile, tap a task to select it and then use the **T** button to edit; tapping the text alone does not place a cursor.
- **Reordering:** Drag tasks and use a section grip to reorder sections. A highlighted insertion line previews where an item will land.
- **Add tasks:** With no task or section selected, the **+** button adds a task to the bottom of the board.
- **Quick actions:** Mark tasks complete and undo checklist edits, toggles, or deletions. Undo is available from the curved-arrow button in the top toolbar and with `Ctrl+Z` / `Cmd+Z`.
- **Mobile toolbar:** The bottom toolbar stays in place when the keyboard opens.
- **Task deletion on mobile:** Swipe left to reveal the delete button; a task is deleted only when you tap the trash icon.

#### Organization and preferences
- **Pinned checklists:** Keep important boards close at hand in a dedicated pinned section.
- **Sort options:** Sort by date edited, date created, alphabetically (A–Z), or the default manual order.
- **Created and edited times:** Keep track of when a checklist was created and last updated, with relative edit times such as *edited Yesterday*.
- **English and German:** Switch the app language between English and German.

#### Data and offline use
- **Offline-ready:** The app is designed to work offline after it has been loaded.
- **Local storage:** Your checklists are saved in your browser on your device.
- **JSON import and export:** Back up or move your checklist data.

### Install the app

#### iPhone or iPad (Safari)
1. Open the app website in Safari.
2. Tap **Share** (the box with the upward arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**. Checklists will open in its own fullscreen window.

#### Mac, Windows, Android, and other supported browsers
1. Open the app website in your browser.
2. Find the **Install** icon in the address bar, or open the browser menu and choose **Install Checklists**.
3. Confirm to add Checklists to your device.

### Future plans

An account-management backend with login and online synchronization may be added in a future update. This would let users sync their checklists across devices. **Accounts and cloud sync are not available in the current version**; checklist data is currently stored locally in the browser.

### License

This project is open-source under the [MIT License](LICENSE).
