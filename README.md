# Navigium Punkte-Editor

Eine moderne React-Webanwendung zur Verwaltung von Lernpunkten in der Navigium Lernplattform für Latein und Griechisch. Diese Anwendung ermöglicht es authentifizierten Benutzern, ihre Punktestände einzusehen und zu bearbeiten.

## 🚀 Features

- **Benutzerverwaltung**: Sichere Anmeldung mit Navigium-Zugangsdaten
- **Punkteverwaltung**: Anzeige und Bearbeitung von Lernpunkten
- **Automatische Sitzungsverlängerung**: Automatische Anmeldung alle 5 Minuten
- **API-Logging**: Detaillierte Protokollierung aller API-Anfragen und -Antworten
- **Responsive Design**: Optimierte Darstellung auf Desktop und Mobilgeräten
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
- **React Hook Form** - Formularverwaltung

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

### Anmeldung
1. Öffne die Anwendung
2. Gib deinen Navigium-Benutzernamen und Passwort ein
3. Wähle die Sprache (Latein/Griechisch/Englisch)
4. Klicke auf "Anmelden"

### Punkteverwaltung
- **Aktueller Punktestand**: Wird automatisch angezeigt
- **Punkte ändern**: Verwende die Schnellbuttons (+1, -1, +10, -10) oder gib einen Zielwert ein
- **Punkte aktualisieren**: Klicke auf "Aktualisieren" oder verwende die Schnellbuttons

### API-Logs
- Klappe den "API-Anfragen"-Bereich auf, um alle API-Aufrufe zu sehen
- Logs enthalten Request-Details, Response-Status und Fehler
- Logs werden automatisch alle 5 Minuten mit der Sitzungsverlängerung aktualisiert

## 🔌 API-Integration

### n8n Webhook-Endpunkte
Die Anwendung kommuniziert mit folgenden n8n-Webhook-Endpunkten:

- **Login**: `POST /webhook/navigium/login`
  - Parameter: `user`, `password`, `lang`
  - Response: Benutzerdaten und aktueller Punktestand

- **Punkte setzen**: `GET /webhook/navigium/setpoints`
  - Parameter: `name`, `diff`, `lang`
  - Response: Aktualisierte Punktestand-Informationen

- **Punkte abrufen**: `GET /webhook/navigium/getpoints`
  - Parameter: `name`, `lang`
  - Response: Aktuelle Punktestand-Informationen

### Authentifizierung
- Alle API-Aufrufe verwenden den Header: `x-internal-key: BANANA`
- Sitzungen werden im localStorage gespeichert
- Automatische Sitzungsverlängerung alle 5 Minuten

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
├── components/          # Wiederverwendbare UI-Komponenten
│   ├── ui/             # shadcn/ui Komponenten
│   └── RequestLog.tsx  # API-Logging-Komponente
├── pages/              # Seitenkomponenten
│   ├── Login.tsx       # Anmeldeseite
│   ├── Dashboard.tsx   # Haupt-Dashboard
│   └── NotFound.tsx    # 404-Seite
├── lib/                # Hilfsfunktionen und API
│   ├── navigium-api.ts # API-Integration
│   └── utils.ts        # Utility-Funktionen
├── hooks/              # Custom React Hooks
├── integrations/       # Externe Integrationen
│   └── supabase/       # Supabase-Client
└── App.tsx            # Hauptkomponente
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