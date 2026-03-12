// ═══════════════════════════════════════════════════════════
// Google Sheets – Leads automatisch speichern
// Datei: /lib/sheets.js
// Nutzt Google Sheets API v4
// ═══════════════════════════════════════════════════════════

export async function saveLeadToSheets(leadData) {
  const sheetId      = process.env.GOOGLE_SHEET_ID;
  const clientEmail  = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey   = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!sheetId || !clientEmail || !privateKey) {
    console.warn('⚠️ Google Sheets nicht konfiguriert – Lead nicht gespeichert');
    console.log('Lead-Daten:', leadData);
    return;
  }

  try {
    // JWT Token für Google API erstellen
    const token = await getGoogleAccessToken(clientEmail, privateKey);

    // Datum formatieren
    const datum = new Date().toLocaleString('de-DE', {
      timeZone: 'Europe/Berlin',
      day:    '2-digit',
      month:  '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });

    // Neue Zeile in Google Sheet anhängen
    // Spalten: Datum | Name | Firma | Branche | Interesse (Kat.) | Telefon | Status
    const values = [[
      datum,
      leadData.name      || '–',
      leadData.firma     || '–',
      leadData.branche   || '–',
      leadData.interesse ? `Kategorie ${leadData.interesse}` : '–',
      leadData.telefon   || '–',
      'Neu',             // Status – kann manuell geändert werden
    ]];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A:G:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ values }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sheets API Fehler: ${error}`);
    }

    console.log(`✅ Lead gespeichert: ${leadData.name} (${leadData.firma})`);

  } catch (error) {
    console.error('❌ Fehler beim Speichern des Leads:', error);
    // Fehler nicht weiterwerfen – Bot soll trotzdem funktionieren
  }
}

// Google JWT Access Token erstellen (ohne externe Library)
async function getGoogleAccessToken(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);

  const header  = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    iss:   clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  }));

  const signingInput = `${header}.${payload}`;

  // Private Key importieren
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder   = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signingInput)
  );

  const b64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${signingInput}.${b64Signature}`;

  // Token bei Google holen
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}
