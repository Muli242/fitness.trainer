# Fitness Trainer (Angular 18 PWA)
    npm install
    npm start                             # Entwicklung (Service Worker aus)
    npm run build && npm run serve:prod   # PWA-Test auf http://localhost:8080
Übungen: public/assets/exercises.json (wird beim Start geladen). Pläne & Notizen: localStorage.
Installation auf Handy/Tablet setzt Auslieferung per HTTPS voraus.

## Veröffentlichen (GitHub Pages I)
1. Repository auf GitHub anlegen (öffentlich), Projekt pushen (Branch `main`), `package-lock.json` mit committen.
2. Repository → Settings → Pages → Source: **GitHub Actions**.
3. Jeder Push auf `main` startet `.github/workflows/deploy.yml`; die App liegt dann unter `https://<user>.github.io/<repo>/`.
