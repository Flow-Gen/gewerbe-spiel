# Gewerbe-Spiel – Landing Pages

Statische Landing Pages für das **Gewerbe-Spiel** in deutschen Städten.  
Gehostet auf **Vercel** mit automatischem Deploy via GitHub.

## Städte

| Stadt | URL | Status |
|---|---|---|
| Konstanz | `gewerbe-spiel.de/konstanz` | ✅ Aktiv |
| Lörrach | `gewerbe-spiel.de/loerrach` | ✅ Aktiv |

## Neue Stadt hinzufügen

1. Ordner kopieren: `cp -r konstanz/ NEUESTADT/`
2. In `NEUESTADT/index.html` ersetzen:
   - `@@STADTNAME@@` → stadtname (kleingeschrieben)
   - `@@STADTNAME_GROSS@@` → Stadtname
   - `@@SHEET_ID@@` → Google Sheets ID der Felder-Tabelle
   - `@@JAHR@@` → aktuelles Jahr
3. Alternativ: `TEMPLATE.html` kopieren und Platzhalter ersetzen
4. In `vercel.json` neuen Rewrite hinzufügen
5. Push to GitHub → Vercel deployed automatisch

## Architektur

```
Landing Pages (dieses Repo, Vercel)
        ↓
   WhatsApp CTA-Button
        ↓
   WhatsApp Bot (n8n)
        ↓
   Google Sheets (Feldstatus)
   Telegram (Admin-Benachrichtigung)
   Stripe (Zahlung)
```

**Der WhatsApp-Chatbot läuft komplett über n8n** (`n8n.srv842714.hstgr.cloud`).  
Die Bot-Dateien (`api/`, `lib/`) wurden aus diesem Repo entfernt (Stand: Mai 2026).

## Dateien

| Datei | Beschreibung |
|---|---|
| `konstanz/index.html` | Landing Page Konstanz |
| `loerrach/index.html` | Landing Page Lörrach |
| `TEMPLATE.html` | Vorlage für neue Städte |
| `vercel.json` | URL-Rewrites + Redirects |
| `PROMPT_FAQ_UPDATE.md` | FAQ-Ergänzungen für den n8n Bot-Prompt |

## Google Sheets

- **Felder-Sheet** (öffentlich): `1EDU-D5jB6qU0rHBupbKb9u4mSg_CPp0Z0vNJLhoWgXA`
- **Reservierungen-Sheet** (privat): `1z5fqYg7zoA_goNh47d98RZCNN6LCUAeeYo3wBXrbztQ`

## Kontakte

- **SpielFam GmbH**: Thomas Rüegg (info@gewerbe-spiel.ch), Ramona Heldstab (rh@gewerbe-spiel.ch)
- **Flow-Gen**: hello@flow-gen.ai
