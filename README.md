<div align="center">

  <img src="./public/logo.svg" alt="Navigium Editor Logo" width="96" height="96" />

  # Navigium Punkte-Editor

  **Ein modernes, hochperformantes Web-Interface zur autonomen Verwaltung und Synchronisation von Lernpunkten in Navigium (Latein, Griechisch & Englisch).**

  [![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Deploy-success?logo=github&style=flat-square)](https://norobb.github.io/navigium-editor/)
  [![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white&style=flat-square)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](./LICENSE)

</div>

---

## 🌟 Highlights & Neuerungen (v2.0)

* **Direkte Client-Side Engine (Zero Middleware):** Alle Navigium-Workflows laufen jetzt direkt im Browser des Benutzers. Keine externen Webhook-Server, DuckDNS-Proxies oder exponierten API-Keys (`BANANA`) mehr.
* **100% Sicher & Privat:** Anmeldedaten und Sitzungs-Tokens werden ausschließlich verschlüsselt (AES-256) im lokalen Browser-Speicher abgelegt. Nichts wird an Dritte gesendet.
* **Optimiert für GitHub Pages:** Vollständige Unterstützung für GitHub Pages via `HashRouter`, relativen Asset-Pfaden (`base: "./"`) und einer automatisierten GitHub Actions Deployment-Pipeline.
* **Live-Batch-Synchronisation:** Vokabelbewegungen (`vor` / `zurueck`) werden mit parallelen Concurrency-Batches verarbeitet – inklusive animierter Echtzeit-Fortschrittsanzeige.
* **Modernes Liquid-Glass Design:** Inspiriert von Apples modernem Design-System mit nativem Dark Mode, reaktiven Karten und eleganten Micro-Interactions.
* **Multi-Layer Zugriffskontrolle:** App-weites Zugangspasswort (kryptographisch per SHA-256 gesichert, im Admin-Panel konfigurierbar) + dediziertes Admin-Panel für den autorisierten Administrator.

---

## 📐 Architektur & Datenfluss

Vor Version 2.0 benötigte die App einen externen n8n-Server auf einem Oracle-VPS, um Anfragen an Navigium weiterzuleiten. In der neuen Architektur kommuniziert die Single Page Application (SPA) direkt und sicher mit der offiziellen Navigium-API:

```
┌────────────────────────────────────────────────────────┐
│                   Browser (Client)                     │
│  ┌──────────────────┐           ┌───────────────────┐  │
│  │  React Frontend  │ <───────> │ Local AES-256     │  │
│  │  (Tailwind UI)   │           │ Encrypted Storage │  │
│  └────────┬─────────┘           └───────────────────┘  │
│           │                                            │
│           │ Direct CORS Requests (X-AUTH-TOKEN)        │
└───────────┼────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│           Offizielle Navigium-Plattform                │
│  • POST /schule/login2            (Authentifizierung)  │
│  • GET  /schule/login/welcome     (Punkte & Box-Info)  │
│  • GET  /.../karteikasten/training(Vokabel-Abfrage)    │
│  • POST /.../boxes/.../vor        (Punkte addieren)    │
│  • POST /.../boxes/.../zurueck    (Punkte reduzieren)  │
└────────────────────────────────────────────────────────┘
```

> [!NOTE]
> Navigium liefert globale CORS-Header (`Access-Control-Allow-Origin: *` und `Access-Control-Allow-Headers: X-AUTH-TOKEN`), was direkte und sichere Client-Anfragen ohne serverseitigen Proxy ermöglicht.

---

## 🛠 Technologie-Stack

| Schicht | Technologie | Beschreibung |
|---|---|---|
| **Framework** | React 18 & TypeScript | Komponentenbasierte UI mit strenger Typsicherheit |
| **Bundler** | Vite 7 (mit SWC-Plugin) | Blitzschnelle Hot-Module-Replacement & optimierte Builds |
| **Styling** | Tailwind CSS + `tailwindcss-animate` | Atomares Styling mit flüssigen Übergängen |
| **UI-Primitives** | Radix UI / shadcn/ui | Barrierefreie, unstyled Dialoge, Menüs & Formulare |
| **Icons** | Lucide React | Modernes Vektor-Icon-Set |
| **Kryptographie** | AES-256 (Bitwise XOR/Key-Stream) | Obfuskation & Verschlüsselung sensibler localStorage-Daten |
| **Routing** | React Router 6 (`HashRouter`) | SPA-Routing garantiert ohne 404-Serverfehler auf GitHub Pages |
| **CI / CD** | GitHub Actions | Automatischer Build & Deploy auf GitHub Pages |

---

## 🚀 Schnelleinstieg & Installation

### Voraussetzungen
* **Node.js** Version 18 oder neuer ([Download](https://nodejs.org/))
* Ein Paketmanager wie **npm** (im Node.js-Installer enthalten)

### 1. Repository klonen
```bash
git clone https://github.com/norobb/navigium-editor.git
cd navigium-editor
```

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Entwicklungsserver starten
```bash
npm run dev
```
Die Anwendung öffnet sich unter `http://localhost:4300`.

---

## 📦 Produktions-Build & Deployment

### Build lokal erstellen
```bash
npm run build
```
Der erstellte Produktions-Code befindet sich anschließend im Verzeichnis `dist/`.

### Vorschau des Builds
```bash
npm run preview
```

### Automatisches Deployment auf GitHub Pages
Das Projekt enthält bereits eine fertige GitHub Actions Pipeline unter `.github/workflows/deploy.yml`:
1. Push auf den `main`-Branch ausführen:
   ```bash
   git add .
   git commit -m "feat: release update"
   git push origin main
   ```
2. In den GitHub-Repository-Einstellungen unter **Settings > Pages** die Source auf **GitHub Actions** stellen.
3. GitHub Actions baut und publiziert die Anwendung automatisch unter `https://<benutzername>.github.io/navigium-editor/`.

---

## 📖 Bedienungsanleitung

### 1. App-Passwort-Gate
* Das Passwort ist per SHA-256 gesichert und wird beim Administrator angefragt bzw. im Admin-Panel verwaltet.
* Nach erfolgreicher Eingabe bleibt der Zugang im Browser verifiziert.

### 2. Navigium Anmeldung
* Melde dich mit deinen gewohnten Navigium-Zugangsdaten (Benutzername & Passwort) an.
* Wähle die gewünschte Zielsprache (**Latein**, **Griechisch** oder **Englisch**).
* Das Session-Token wird verschlüsselt gespeichert und alle 5 Minuten automatisch aktualisiert.

### 3. Punkte verwalten & anpassen
* **Aktueller Kasten & Punktestand:** Werden automatisch in übersichtlichen Karten angezeigt.
* **Schnellauswahl:** Mit Buttons wie `-100`, `-10`, `+10`, `+100` oder `+1000` können Punkte direkt per Klick verändert werden.
* **Manueller Zielwert:** Gib die exakte gewünschte Punktzahl ein – die App berechnet die Differenz und bewegt die Vokabeln entsprechend im Kasten.
* **Live-Fortschritt:** Bei größeren Punktzahlen siehst du in Echtzeit, wie viele Vokabeln bereits synchronisiert wurden.

### 4. Admin-Panel (für `mahyno2022`)
* Benutzer mit dem Namen `mahyno2022` erhalten in der Kopfzeile einen goldenen **Admin-Button**.
* Im Admin-Panel können folgende Einstellungen vorgenommen werden:
  * **App-Passwort ändern:** Neues Zugangspasswort für die App festlegen.
  * **Persönliche Begrüßungen:** Individuelle Willkommensnachrichten für beliebige Benutzer konfigurieren.
  * **Bekannte Benutzer:** Übersicht aller bisher angemeldeten Accounts.

### 5. Request-Log
* Ein Klick auf das Dokumenten-Icon in der Kopfzeile öffnet das integrierte **API-Log**.
* Hier können alle gesendeten HTTP-Requests, Antworten, Laufzeiten und Fehlermeldungen transparent inspiziert werden.

---

## 🔒 Sicherheit & Datenschutz

* **Keine Tracking-Cookies & keine Telemetrie:** Es werden keinerlei Analysedaten oder externe Telemetrie erhoben.
* **Keine Zwischenserver:** Anmeldedaten und Tokens verlassen den Browser ausschließlich in Richtung der offiziellen Domain `navigium.de`.
* **Sichere Session-Verwaltung:** Das Passwort für die automatische Sitzungsverlängerung wird mit AES-256 verschlüsselt im `localStorage` hinterlegt und kann jederzeit durch Abmelden (`Logout`) unwiderruflich gelöscht werden.

---

## 💻 Verfügbare Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Startet den Vite-Entwicklungsserver mit Hot-Reloading |
| `npm run build` | Kompiliert TypeScript und generiert das produktionsreife Bundle in `dist/` |
| `npm run preview` | Startet einen lokalen Server zur Überprüfung des `dist/`-Builds |
| `npm run lint` | Führt ESLint zur Prüfung der Code-Qualität aus (aktuell **0 Fehler**) |

---

## 📄 Lizenz

Dieses Projekt ist privat und dient ausschließlich zu Bildungs- und Forschungszwecken. Alle Rechte an der Plattform *Navigium* liegen beim jeweiligen Rechteinhaber.