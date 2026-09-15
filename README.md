<div align="center">

  <h1>🌸 AARAMBH</h1>
  <p><strong>Your Angelic Habit Guide & Personal Discipline Companion</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#pwa--seo">PWA & SEO</a> •
    <a href="#license">License</a>
  </p>

  [![PWA Ready](https://img.shields.io/badge/PWA-Ready-ff8fa3?style=for-the-badge&logo=pwa&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
  [![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  [![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)

</div>

---

## 🌟 Overview

**AARAMBH** is a beautifully crafted, mobile-first Progressive Web Application (PWA) designed to foster self-discipline, consistent habits, emotional reflection, and personal growth. With a soothing pastel aesthetic and empathetic, supportive copywriting ("Angelic Guide"), AARAMBH helps you build lasting daily routines and overcome moments of weakness.

---

## ✨ Features

- 💖 **Angelic Habit Tracker**: Track daily habits and sacred vows with smooth haptic feedback and real-time completion progress rings.
- 🌸 **Growth Garden (28-Day Heatmap)**: Visual habit streak calendar displaying your consistency over the last 28 days ("Harvests").
- 🆘 **Rescue Button ("Save me, I'm slipping")**: A dedicated emergency modal offering reassuring words, high-score reminders, and grounding steps during moments of temptation or relapse.
- 📜 **Sacred Commitments**: Custom list of personal vows and principles to keep you anchored to your core values.
- 📖 **Soul Diary**: Private daily reflection journal with historic log storage and entry repair/edit capabilities.
- ⚡ **PWA Support**: Full offline functionality with Service Worker caching and installable standalone app capability on mobile and desktop.
- 🔒 **100% Private & Local**: All data is stored locally in your browser (`localStorage`). Features full JSON Export & Import for data backups.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, ES6+ JavaScript
- **Styling**: Tailwind CSS (via CDN) with custom CSS variables (`--princess`, `--lavender`, `--cream`)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Typography**: Google Fonts (*Quicksand*, *Poppins*)
- **PWA Infrastructure**: Service Worker (`sw.js`) and Web Application Manifest (`manifest.json`)
- **Storage**: Browser `localStorage` API with JSON Backup/Restore

---

## 🚀 Getting Started

No build process or complex setup required! AARAMBH runs directly in any web browser.

### Option 1: Live Server / Static Host
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aarambh.git
   cd aarambh
   ```
2. Open `index.html` in your browser or run a simple local HTTP server:
   ```bash
   # Using Python
   python3 -m http.server 8000

   # Using npx serve
   npx serve .
   ```
3. Visit `http://localhost:8000` in your web browser.

### Option 2: Deploy to GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, select **Deploy from a branch** and set `main` branch `/ (root)`.
4. Your PWA will be live at `https://<your-username>.github.io/<repository-name>/`.

---

## 📱 PWA & SEO Optimization

AARAMBH is built with modern PWA and SEO best practices:
- **PWA Ready**: Web App Manifest, Apple Touch Icons, and Service Worker offline caching.
- **Search Engine Optimized**: Includes Open Graph tags (for X and social previews), Schema.org `WebApplication` structured data (JSON-LD), `sitemap.xml`, and `robots.txt`.

---

## 📁 Repository Structure

```
AARAMBH/
├── index.html        # Main SPA interface & application state engine
├── manifest.json     # Web App Manifest for PWA installation
├── sw.js             # Service Worker for offline asset caching
├── robots.txt        # Search engine crawler configuration
├── sitemap.xml       # Web XML sitemap for SEO indexing
├── .gitignore        # Standard Git ignore configuration
├── LICENSE           # MIT Open Source License
└── README.md         # Repository documentation
```

---

## 🔒 Privacy & Security

AARAMBH respects your privacy. **Zero user data is sent to external servers.** 
- All habit data, diary entries, and settings reside strictly in your browser's local storage.
- You can export your data at any time via **Settings > Export** or import backups seamlessly.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">
  <sub>Made with ❤️ and light for your journey towards self-mastery.</sub>
</div>
