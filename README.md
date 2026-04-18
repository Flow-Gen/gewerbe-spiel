# 🎲 Gewerbe-Spiel WhatsApp Bot

KI-WhatsApp-Bot für das Gewerbe-Spiel – läuft vollständig auf Vercel (kostenlos).

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
│   ├── sheets.js           ← Leads + Reservierungen → n8n
│   └── felder.js           ← Live-Feldstatus aus Google Sheets
├── konstanz/
│   └── index.html          ← Landing Page Konstanz
├── loerrach/
│   └── index.html          ← Landing Page Lörrach
├── TEMPLATE.html           ← Vorlage für neue Städte
├── vercel.json
├── package.json
└── .env.example            ← Alle benötigten Variablen
```

---

## Neue Stadt hinzufügen

1. `TEMPLATE.html` kopieren → z.B. `freiburg/index.html`
2. Find & Replace:

| Platzhalter | Ersetzen mit | Beispiel |
|---|---|---|
| `@@STADTNAME@@` | Stadtname | `Freiburg` |
| `@@STADTNAME_GROSS@@` | Großbuchstaben | `FREIBURG` |
| `@@STADTNAME_URL@@` | URL-kodiert | `Freiburg` |
| `@@SHEET_ID@@` | Google Sheets ID | `1BxiMVs0...` |

3. Git push → Vercel deployed automatisch

---

## Environment Variables (Vercel)

| Variable | Beschreibung |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Developer Portal |
| `WHATSAPP_ACCESS_TOKEN` | Meta Permanent Token |
| `WEBHOOK_VERIFY_TOKEN` | Selbst gewählt |
| `OPENAI_API_KEY` | OpenAI API Key |
| `N8N_WEBHOOK_URL` | n8n Webhook für Leads + Reservierungen |
| `GOOGLE_SHEET_FELDER` | Sheet-ID für Feldverfügbarkeit |

---

## Bot-Workflow

```
1. Interessent schreibt WhatsApp
2. Bot informiert + zeigt freie Felder (live)
3. Bot sammelt: Name, Firma, Branche, Wunschfeld
4. n8n: Feld → "reserved", Lead gespeichert, Telegram-Benachrichtigung
5. Du bestätigst → Stripe-Link wird gesendet
6. Zahlung → Feld "taken", Bestätigung an Kunden
```

---

## Kosten/Monat

| Service | Kosten |
|---|---|
| Vercel Free | $0 |
| Meta Cloud API | $0 |
| OpenAI gpt-4o-mini | ~$1–3 |
| **Gesamt** | **~$1–3** |
