# Learn Password

This project was developed completely by AI.

It was made with AI because of a lack of time and because I wanted to learn a new password NOW.

---

## Project Details

A modern single-page React app with two separate sides:

- **Password Generator side**: dynamically loads words from `words/*.txt` and supports language selection
- **Learning side**: lets you enter/retype the password and practice with live feedback

Tech stack:

- React + Vite
- Tailwind CSS
- daisyUI component library

Features:

- dynamic language-based word password generation
- live strength meter and match feedback
- show/hide toggles on both learning inputs
- copy actions for generated and learning passwords
- responsive two-column layout

## Quick start

```bash
cd /home/pascal/Projects/learn-password
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

- `index.html` – Vite entry HTML
- `src/main.jsx` – React bootstrap
- `src/App.jsx` – generator + learning sides UI logic
- `src/index.css` – Tailwind entry stylesheet
- `tailwind.config.js` – Tailwind and daisyUI configuration
- `postcss.config.js` – PostCSS pipeline
- `package.json` – scripts and dependencies

## TODOs

- [ ] Save hashed password in database so that it has to be entered only one time.
- [ ] Add spaced-repetition notifications to learn the password regularly (e.g., 1 hour, 2 hours, 4 hours, 8 hours, etc.).