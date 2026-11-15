<div align="center">

  <h1>🌸 AARAMBH</h1>
  <p><strong>Your Angelic Habit Guide &amp; Personal Discipline Sanctuary</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#testing">Testing</a> •
    <a href="#privacy--security">Privacy &amp; Security</a> •
    <a href="#license">License</a>
  </p>

  [![PWA Ready](https://img.shields.io/badge/PWA-Ready-ff8fa3?style=for-the-badge&logo=pwa&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
  [![Local First](https://img.shields.io/badge/Storage-IndexedDB-purple?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
  [![Accessibility](https://img.shields.io/badge/WCAG_2.2-AA_Compliant-success?style=for-the-badge)](https://www.w3.org/WAI/standards-guidelines/wcag/)
  [![Zero Tracking](https://img.shields.io/badge/Privacy-100%25_Local-blue?style=for-the-badge)](#privacy--security)
  [![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)

</div>

---

## 🌟 Overview

**AARAMBH** is a local-first, deeply supportive Progressive Web Application (PWA) designed for personal spiritual growth, daily self-discipline, and quiet inner reflection in the "Soul Diary".

Everything lives exclusively on the user's device. There are zero accounts, no cloud sync, no public feeds, and no surveillance analytics.

---

## ✨ Features

- 💖 **Angelic Habit Tracker**: Track daily habits and sacred vows with smooth haptic feedback, real-time completion progress rings, and keyboard-accessible toggles (`Space` / `Enter`).
- 🌸 **Growth Garden (28-Day Heatmap)**: Visual habit streak calendar displaying your consistency over the last 28 days ("Harvests").
- 🆘 **Rescue Compass ("Save me, I'm slipping")**: A dedicated emergency modal offering reassuring words, high-score reminders, and grounding steps during moments of temptation.
- 📜 **Sacred Commitments**: Custom list of personal vows and principles to keep you anchored to your core values.
- 📖 **Soul Diary**: Private daily reflection journal with historic log storage, entry repair/edit capabilities, and automatic word-break layout protection.
- 🛡️ **Data Sovereignty & Safety**: Versioned JSON export and safe import validation with a full preview dialog before applying.
- 🔒 **Safeguarded Reset ("Destroy Memory Core")**: Requires typed confirmation (`RELEASE`) and offers an instant backup before erasing.
- ⚡ **Offline-First PWA**: Self-hosted CSS, SVG icons, and Service Worker caching for seamless offline usage without any external CDN dependencies.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, ES6+ JavaScript (zero runtime compilation overhead)
- **Styling**: Self-hosted custom CSS with design tokens (`--princess`, `--lavender`, `--cream`), full WCAG 2.2 AA contrast compliance, and `:focus-visible` states
- **Icons**: Self-hosted accessible SVG icons
- **Architecture**: Split into public prerendered landing page (`index.html`) and private app (`app.html`) with strict `noindex` privacy headers
- **Storage Layer**: Browser `IndexedDB` (`AARAMBH_DB`) with automatic legacy `localStorage` migration and schema versioning
- **PWA Infrastructure**: Service Worker (`sw.js`) and Web Application Manifest (`manifest.json`) with local icons

---

## 🚀 Getting Started

No build tools or external servers required! AARAMBH runs directly in any modern browser.

### Option 1: Local HTTP Server
```bash
# Clone the repository
git clone https://github.com/your-username/AARAMBH.git
cd AARAMBH

# Run using Python 3
python3 -m http.server 8080

# Or run using Node
npx serve .
```
Visit `http://localhost:8080` to view the public landing page, or `http://localhost:8080/app.html` to enter the private sanctuary.

### Option 2: Deploy to GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, select **Deploy from a branch** and set `main` branch `/ (root)`.
4. Your application will be live at `https://<your-username>.github.io/AARAMBH/`.

---

## 🧪 Testing

AARAMBH includes comprehensive unit tests and Playwright end-to-end tests covering all domain algorithms, storage migrations, and user flows:

```bash
# Run all unit and E2E tests
npm test

# Run unit tests only (domain, storage, icons)
npm run test:unit

# Run end-to-end browser tests
npm run test:e2e
```

---

## 📁 Repository Structure

```
AARAMBH/
├── index.html        # Public prerendered landing page (SEO & 100 Lighthouse score)
├── app.html          # Private sanctuary app (IndexedDB, Soul Diary, Habit Guide)
├── manifest.json     # PWA Manifest with self-hosted icons
├── sw.js             # Service Worker for offline asset caching
├── robots.txt        # Crawler configuration (disallows /app.html)
├── sitemap.xml       # XML Sitemap with absolute canonical URL
├── assets/           # Self-hosted SVG & PNG icons, social images, and favicon
│   ├── icon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   └── og-image.png
├── css/
│   └── styles.css    # Self-contained accessible stylesheet (zero CDNs)
├── js/
│   ├── app.js        # Main UI application coordinator
│   ├── domain.js     # Core logic, streak tracking, Growth Garden, XSS sanitization
│   ├── icons.js      # Self-hosted SVG icon definitions
│   └── storage.js    # Local-first IndexedDB storage & JSON backup engine
├── tests/
│   ├── domain.test.js   # Unit tests for habit & streak logic
│   ├── storage.test.js  # Unit tests for IndexedDB & import validation
│   ├── icons.test.js    # Unit tests for SVG icon provider
│   └── e2e.test.js      # Playwright end-to-end test suite
├── AUDIT.md          # Comprehensive Phase 1 security & UX audit report
├── LICENSE           # MIT License
└── package.json      # NPM scripts and project metadata
```

---

## 🔒 Privacy & Security

AARAMBH respects the sanctity of your private thoughts:
- **Zero Data Transmission:** No habit data, diary reflections, or vows are ever sent to any remote server or analytics service.
- **No Third-Party Surveillance:** All fonts, icons, and styles are bundled locally. Zero external CDN calls occur on private screens.
- **Search Engine Isolation:** The private app is marked with `<meta name="robots" content="noindex, nofollow">` and disallowed in `robots.txt`.
- **Complete Data Control:** Export your full database at any time as versioned JSON, or erase it with typed confirmation (`RELEASE`).

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

<div align="center">
  <sub>Made with ❤️ and light for your journey towards self-mastery.</sub>
</div>
