# Navigium Punkte-Editor

Eine moderne React-Webanwendung zur Verwaltung von Lernpunkten in der Navigium Lernplattform für Latein und Griechisch. Diese Anwendung ermöglicht es authentifizierten Benutzern, ihre Punktestände einzusehen und zu bearbeiten.

## 🚀 Features

- **Multi-Layer Authentifizierung**: App-Passwort-Gate + Sitzungsbasierte Authentifizierung
- **Benutzerverwaltung**: Sichere Anmeldung mit Navigium-Zugangsdaten
- **Punkteverwaltung**: Anzeige und Bearbeitung von Lernpunkten
- **Admin-Panel**: Verwaltung von Benutzern, Greetings und App-Passwort (für mahyno2022)
- **Persönliche Greetings**: Benutzerdefinierte Begrüßungsnachrichten pro Benutzer
- **Verschlüsselte Speicherung**: AES-256 Verschlüsselung für sensitive Daten
- **Server-Synchronisation**: Automatische Synchronisation mit n8n mit lokaler Fallback
- **Automatische Sitzungsverlängerung**: Automatische Anmeldung alle 5 Minuten
- **API-Logging**: Detaillierte Protokollierung aller API-Anfragen und -Antworten (in-memory)
- **Responsive Design**: Optimierte Darstellung auf Desktop und Mobilgeräten
- **Dark Mode**: Unterstützung für Dark Mode via Theme Toggle
- **Deutsche Benutzeroberfläche**: Intuitive Navigation in deutscher Sprache

## 🛠 Technologie-Stack

### Frontend
- **React 18** - Moderne UI-Bibliothek
- **TypeScript** - Typsichere JavaScript-Entwicklung
- **Vite** - Schneller Build-Tool und Entwicklungsserver
- **Tailwind CSS** - Utility-First CSS-Framework
- **shadcn/ui** - Hochwertige UI-Komponenten
- **React Router** - Clientseitiges Routing
- **React Query** - Serverzustandsverwaltung
- **TweetNaCl.js** - AES-256 Verschlüsselung für sensitive Daten
- **Lucide React** - Icon-Bibliothek

### Backend-Integration
- **n8n Webhook API** - Externe API für Datenoperationen

### Entwicklungswerkzeuge
- **ESLint** - Code-Linting
- **TypeScript** - Typprüfung
- **Vite** - Entwicklungsserver
- **Lovable Tagger** - Komponenten-Tagging für Entwicklung

## 📋 Voraussetzungen

- **Node.js** 18+ ([Installation](https://nodejs.org/))
- **npm** oder **yarn** oder **bun**
- Zugang zur Navigium Lernplattform

## 🚀 Installation und Setup

### 1. Repository klonen
```bash
git clone <repository-url>
cd navigium_app/navigium-editor
```

### 2. Abhängigkeiten installieren
```bash
npm install
# oder
yarn install
# oder
bun install
```


### 3. Entwicklungsserver starten
```bash
npm run dev
```

Die Anwendung ist nun unter `http://localhost:8080` verfügbar.

## 🏗 Build für Produktion

```bash
# Produktionsbuild erstellen
npm run build

# Build für Entwicklung
npm run build:dev

# Lokale Vorschau des Builds
npm run preview
```

## 🌐 Hosting und Deployment

### Option 1: Vercel (Empfohlen)
1. **Repository mit Vercel verbinden**
   - Gehe zu [vercel.com](https://vercel.com)
   - Importiere dein GitHub-Repository
   - Vercel erkennt automatisch die Vite-Konfiguration

2. **Build-Einstellungen** (falls nötig):
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Deploy**: Klicke auf "Deploy"

### Option 2: Netlify
1. **Repository verbinden**
   - Gehe zu [netlify.com](https://netlify.com)
   - Importiere dein GitHub-Repository

2. **Build-Einstellungen**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

3. **Deploy**: Netlify baut und deployed automatisch

### Option 3: GitHub Pages
1. **gh-pages installieren**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **package.json erweitern**:
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist",
     "predeploy": "npm run build"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

### Option 4: Traditioneller Webserver
1. **Build erstellen**:
   ```bash
   npm run build
   ```

2. **Dist-Verzeichnis auf Webserver hochladen**
   - Der `dist`-Ordner enthält alle nötigen Dateien
   - Stelle sicher, dass der Server SPA-Routing unterstützt (alle Routen zu `index.html` weiterleiten)

### Option 5: Docker
1. **Dockerfile erstellen**:
   ```dockerfile
   FROM nginx:alpine
   COPY dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **nginx.conf**:
   ```nginx
   events {}
   http {
     server {
       listen 80;
       location / {
         root /usr/share/nginx/html;
         try_files $uri $uri/ /index.html;
       }
     }
   }
   ```

3. **Container bauen und starten**:
   ```bash
   docker build -t navigium-editor .
   docker run -p 8080:80 navigium-editor
   ```

## 📖 Verwendung
pp-Passwort-Gate
1. Öffne die Anwendung
2. Gib das App-Passwort ein (Standard: `cheater2025`)
3. Klicke auf "Entsperren"

### Anmeldung
1. Gib deinen Navigium-Benutzernamen und Passwort ein
2. Wähle die Sprache (Latein/Griechisch/Englisch)
3. Klicke auf "Anmelden"
4. Du siehst optional deine persönliche Begrüßung (falls vom Admin gesetzt)

### Punkteverwaltung (Dashboard)
- **Aktueller Punktestand**: Wird automatisch angezeigt
- **Persönliche Begrüßung**: Zeigt deine vom Admin gesetzte Nachricht
- **Punkte ändern**: Verwende die Schnellbuttons (+1, -1, +10, -10) oder gib einen Zielwert ein
- **Punkte aktualisieren**: Klicke auf "Aktualisieren" oder verwende die Schnellbuttons
- **Admin-Badge**: Sichtbar wenn du Administrator (mahyno2022) bist

### Admin-Panel (für mahyno2022)
1. Klicke auf das Schild-Icon im Dashboard
2. Du kannst folgende Aufgaben durchführen:
   - **Bekannte Benutzer verwalten**: Benutzer hinzufügen/löschen
   - **Greetings verwalten**: Persönliche Begrüßungen für jeden Benutzer setzen/löschen
   - **App-Passwort ändern**: Neues Passwort setzen und mit Server synchronisieren
3. Alle Änderungen werden lokal und auf dem Server gespeichert

### API-Logs
- Klappe den "API-Anfragen"-Bereich auf, um alle API-Aufrufe zu sehen
- Logs enthalten Request-Details, Response-Status, Fehler und Zeitstempel
- Max. 100 Log-Einträge werden im Speicher gespeichert zu sehen
- Logs enthalten Request-Details, Response-Status und Fehler
- Logs werden automatisch alle 5 Minuten mit der Sitzungsverlängerung aktualisiert

## 🔌 API-Integration

### n8n Webhook Base URL
```
https://n8n.nemserver.duckdns.org/webhook/navigium
```

### Unterstützte Endpunkte (GET-Anfragen)
Alle Anfragen verwenden den Header: `x-internal-key: BANANA`

| Endpunkt | Parameter | Response | Beschreibung |
|----------|-----------|----------|---------------|
| `login` | `user`, `password`, `lang` | `{ username, aktuellerKarteikasten, gesamtpunkteKarteikasten }` | Benutzer-Authentifizierung |
| `points` | `name`, `lang` | `{ aktuellerKarteikasten, gesamtpunkteKarteikasten }` | Aktuellen Punktestand abrufen |
| `setpoints` | `name`, `diff`, `lang` | `{ aktuellerKarteikasten, gesamtpunkteKarteikasten }` | Punkte hinzufügen/subtrahieren |
| `password` | `password` | `{ status: "success" }` | App-Passwort auf Server setzen |
| `getpassword` | (keine) | `{ password: string }` | App-Passwort vom Server abrufen |
| `greeting` | `user`, `greeting` | `{ status: "success" }` | Begrüßung für Benutzer setzen |
| `greetings` | (keine) | `[ { user, greeting }, ... ]` | Alle Begrüßungen abrufen |

### Verschlüsselung & Speicherung
- **Sensitive Daten**: AES-256 Verschlüsselung mit TweetNaCl.js
- **localStorage Keys**:
  - `navigium_session_v2` - Verschlüsselte Benutzersitzung
  - `app_password_v2` - Verschlüsseltes App-Passwort
  - `user_greetings_v2` - Verschlüsselte Begrüßungen
  - `known_users_v2` - Verschlüsselte Benutzerliste
  - `app_authenticated` - Authentifizierungsflag
- **Auto-Migration**: Alte unverschlüsselte localStorage-Einträge werden automatisch migriert
- **Server-Fallback**: Falls Server nicht erreichbar, werden lokale Werte verwendet

### Sitzungsverwaltung
- Automatische Sitzungsverlängerung: Alle 5 Minuten
- Benutzername und Passwort werden lokal für Auto-Refresh gespeichert
- Sitzungen persisten über Browser-Neuladen

## 🧪 Entwicklung

### Code-Qualität
```bash
# Linting
npm run lint

# TypeScript-Prüfung
npx tsc --noEmit
```

### Projektstruktur
```
src/
├── components/                # Wiederverwendbare UI-Komponenten
│   ├── ui/                   # shadcn/ui Komponenten
│   ├── AppPasswordGate.tsx   # App-Level Authentifizierung
│   ├── RequestLog.tsx        # API-Logging-Komponente
│   ├── ThemeToggle.tsx       # Dark Mode Toggle
│   └── NavLink.tsx           # Navigation Link Komponente
├── pages/                     # Seitenkomponenten
│   ├── Login.tsx             # Anmeldeseite
│   ├── Dashboard.tsx         # Haupt-Dashboard mit Punkteverwaltung
│   ├── AdminPanel.tsx        # Admin-Panel (nur für mahyno2022)
│   ├── Index.tsx             # Home-Weiterleitung
│   └── NotFound.tsx          # 404-Seite
├── lib/                       # Hilfsfunktionen und API
│   ├── navigium-api.ts       # API-Integration, Session, Auth, Greetings
│   ├── crypto.ts             # AES-256 Verschlüsselung
│   └── utils.ts              # Utility-Funktionen
├── hooks/                     # Custom React Hooks
│   ├── use-theme.tsx         # Theme Provider für Dark Mode
│   ├── use-toast.ts          # Toast Notifications
│   └── use-mobile.tsx        # Mob + Dark Mode Support
- **State Management**: React Query für Server-Zustand, localStorage für Persistierung
- **Error Handling**: Toast-Benachrichtigungen für Fehler mit Fallback auf localStorage
- **Logging**: Alle API-Aufrufe werden automatisch geloggt (in-memory, max. 100 Einträge)
- **Verschlüsselung**: AES-256 für alle sensitive Daten in localStorage
- **Authentication**: Multi-Layer (App-Passwort-Gate → Sitzungsbasierte Auth)
- **Admin**: Hardcoded Benutzer `mahyno2022` hat Zugriff auf Admin-Panel
- **Default App-Passwort**: `cheater2025` (kann im Admin-Panel geändert werden)r
```

### Wichtige Konventionen
- **Path Aliases**: Verwende `@/` für `src/`
- **Komponenten**: Funktionale Komponenten mit TypeScript
- **Styling**: Tailwind CSS Klassen
- **State Management**: React Query für Server-Zustand
- **Error Handling**: Toast-Benachrichtigungen für Fehler
- **Logging**: Alle API-Aufrufe werden automatisch geloggt

## 🤝 Mitwirken

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist privat und nicht für die öffentliche Verwendung bestimmt.

## 🆘 Support

Bei Fragen oder Problemen:
1. Überprüfe die API-Logs in der Anwendung
2. Stelle sicher, dass die Navigium-API erreichbar ist
3. Überprüfe die Browser-Konsole auf Fehler

## 🔄 Updates

Die Anwendung lädt sich automatisch neu bei Änderungen während der Entwicklung. Für Produktions-Updates muss die Anwendung neu gebaut und deployed werden.</content>
<parameter name="filePath">c:\Users\marya\coding\navigium_app\navigium-editor\README.md