# Portfolio — Karim Sehil

Personal portfolio of **Karim Sehil — Cyber Security Analyst · Application Security**.
From the lab floor to production code.

🔗 **Live site:** https://karimsehil.com

## About

A single-page, hand-built portfolio — no framework, no build step. Everything
lives in `index.html`, except the 3D intro of the arcade mode (`arcade/`), which
is only downloaded when arcade mode is opened. Highlights:

- 🌐 **Bilingual** EN / FR with a live language toggle
- 🎮 **Arcade mode** — a playable, pixel-art / retro-game version of the site (tear the page from the top-right corner, or hit "Launch arcade mode")
- 🖥️ **3D intro** — a real-time 3D room (three.js, all procedural): the sky outside the window follows the visitor's local time; click the screen to dive into the game. Falls back to the pixel-art scene without WebGL2 or with reduced motion
- ♿ Responsive, accessible, motion-reduced friendly
- 🔎 SEO: schema.org Person, Open Graph / Twitter cards

## Tech

- HTML5 / CSS3 (custom properties, responsive grid)
- Vanilla JavaScript (language toggle, page-peel canvas, embedded arcade)
- three.js r170, vendored in `arcade/vendor/` (MIT) — scene in `arcade/scene3d.js`; `arcade/preview.html` shows the room alone with a time-of-day slider
- Google Fonts (Space Grotesk, Hanken Grotesk, Space Mono)
- Deployed on Netlify

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Contact

- Portfolio: https://karimsehil.com
- LinkedIn: https://www.linkedin.com/in/karim-sehil
- GitHub: https://github.com/KarimS78
