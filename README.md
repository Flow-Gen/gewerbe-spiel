# 🎲 Gewerbe-Spiel WhatsApp Bot

KI-WhatsApp-Bot für das Gewerbe-Spiel Konstanz – läuft vollständig auf Vercel (kostenlos).

---

## Projektstruktur

```
/
├── api/
│   └── webhook.js          ← WhatsApp Webhook (Herzstück des Bots)
├── lib/
│   ├── openai.js           ← KI-Logik + System-Prompt
│   ├── whatsapp.js         ← Nachrichten senden
│   ├── conversation.js     ← Gesprächsverlauf (Vercel KV)
│   └── sheets.js           ← Leads in Google Sheets speichern
├── konstanz/
│   └── index.html          ← Landing Page Konstanz
├── loerrach/
│   └── index.html          ← Landing Page Lörrach
├── TEMPLATE.html           ← Vorlage für neue Städte
├── vercel.json             ← Vercel Konfiguration
├── package.json
└── .env.example            ← Alle benötigten Variablen (Vorlage)
```

---

## Setup-Anleitung

### Schritt 1 – Repository vorbereiten
```bash
# Dieses Projekt in dein GitHub-Repo pushen
git add .
git commit -m "Gewerbe-Spiel Bot initiales Setup"
git push
```

### Schritt 2 – Vercel KV einrichten
1. Vercel Dashboard → dein Projekt → **Storage**
2. → **Create Database** → **KV**
3. Name: `gewerbe-spiel-kv` → **Create**
4. → **Connect to Project** → dein Projekt wählen
5. ✅ Fertig – Vercel setzt die KV-Variablen automatisch

### Schritt 3 – Umgebungsvariablen in Vercel eintragen
Vercel Dashboard → Projekt → **Settings** → **Environment Variables**

| Variable | Woher |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Developer Portal → WhatsApp → API Setup |
| `WHATSAPP_ACCESS_TOKEN` | Meta Developer Portal → Permanent Token |
| `WEBHOOK_VERIFY_TOKEN` | Selbst wählen, z.B. `gewerbe-spiel-2026` |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `GOOGLE_SHEET_ID` | Aus der Google Sheets URL |
| `GOOGLE_CLIENT_EMAIL` | Google Cloud → Service Account |
| `GOOGLE_PRIVATE_KEY` | Google Cloud → Service Account → JSON Key |

### Schritt 4 – Meta Webhook konfigurieren
1. Meta Developer Portal → deine App → WhatsApp → Configuration
2. Webhook URL: `https://gewerbe-spiel.de/api/webhook`
3. Verify Token: gleicher Wert wie `WEBHOOK_VERIFY_TOKEN`
4. → **Verify and Save**
5. Subscribed Fields: ✅ **messages** aktivieren

### Schritt 5 – Google Sheets einrichten
1. Neues Google Sheet erstellen
2. Erstes Tab umbenennen: **Leads**
3. Kopfzeile in Zeile 1 eintragen:
   ```
   A1: Datum  B1: Name  C1: Firma  D1: Branche  E1: Interesse  F1: Telefon  G1: Status
   ```
4. Service Account Zugriff geben:
   - Google Cloud Console → Service Account E-Mail kopieren
   - Im Sheet: Freigeben → E-Mail einfügen → Bearbeiter

---

## Neue Stadt hinzufügen

```bash
# TEMPLATE.html kopieren und anpassen
cp TEMPLATE.html freiburg/index.html

# Find & Replace in der neuen Datei:
# @@STADTNAME@@       → Freiburg
# @@STADTNAME_GROSS@@ → FREIBURG
# @@SHEET_ID@@        → Google Sheets ID für Freiburg
# @@JAHR@@            → 2026
```

---

## Kosten (monatlich)

| Service | Kosten |
|---|---|
| Vercel (Free Tier) | $0 |
| Vercel KV (Free Tier) | $0 |
| Meta Cloud API | $0 |
| OpenAI gpt-4o-mini | ~$1–3 |
| **Gesamt** | **~$1–3/Monat** |

---

## WhatsApp-Nummer ändern

Wenn die echte Nummer feststeht, suche in allen HTML-Dateien nach `41786809040` und ersetze global.
