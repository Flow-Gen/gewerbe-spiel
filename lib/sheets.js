// ═══════════════════════════════════════════════════════════
// Lead & Reservierung via n8n Webhook
// Datei: /lib/sheets.js
// ═══════════════════════════════════════════════════════════

const N8N_URL = process.env.N8N_WEBHOOK_URL;

// Lead ins Reservierungen-Sheet speichern
export async function saveLeadToSheets(leadData) {
  await sendToN8n('lead', {
    datum:     formatDate(),
    name:      leadData.name      || '–',
    firma:     leadData.firma     || '–',
    branche:   leadData.branche   || '–',
    interesse: leadData.interesse ? `Kategorie ${leadData.interesse}` : '–',
    telefon:   leadData.telefon   || '–',
    status:    leadData.status    || 'Interesse',
  });
}

// Feld reservieren → n8n updated Felder-Sheet + sendet Telegram-Benachrichtigung
export async function reservieresFeld(data) {
  await sendToN8n('reservierung', {
    datum:     formatDate(),
    name:      data.name      || '–',
    firma:     data.firma     || '–',
    branche:   data.branche   || '–',
    feld:      data.feld      || '–',
    kategorie: data.kategorie ? `Kategorie ${data.kategorie}` : '–',
    preis:     data.preis     || '–',
    telefon:   data.telefon   || '–',
    status:    'Ausstehend',
  });
}

async function sendToN8n(type, payload) {
  if (!N8N_URL) {
    console.warn(`⚠️ N8N_WEBHOOK_URL fehlt – ${type} nicht gesendet`);
    return;
  }
  try {
    const response = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...payload }),
    });
    if (!response.ok) throw new Error(`n8n Fehler: ${response.status}`);
    console.log(`✅ ${type} an n8n gesendet`);
  } catch (error) {
    console.error(`❌ Fehler beim Senden (${type}):`, error);
  }
}

function formatDate() {
  return new Date().toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Rückfrage an Admin – Branche unklar
export async function sendeRueckfrage(data) {
  await sendToN8n('rueckfrage', {
    datum:   formatDate(),
    name:    data.name    || '–',
    firma:   data.firma   || '–',
    branche: data.branche || '–',
    telefon: data.telefon || '–',
    status:  'Branche unklar – Rückfrage nötig',
  });
}

// Warteliste – Branche vergeben, andere Städte gewünscht
export async function sendeWarteliste(data) {
  await sendToN8n('warteliste', {
    datum:    formatDate(),
    name:     data.name    || '–',
    firma:    data.firma   || '–',
    branche:  data.branche || '–',
    staedte:  data.staedte || '–',
    telefon:  data.telefon || '–',
    status:   'Warteliste',
  });
}
