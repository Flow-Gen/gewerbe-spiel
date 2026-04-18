// ═══════════════════════════════════════════════════════════
// Feldverfügbarkeit live aus Google Sheets laden
// Datei: /lib/felder.js
// ═══════════════════════════════════════════════════════════

const SHEET_ID = process.env.GOOGLE_SHEET_FELDER || '1EDU-D5jB6qU0rHBupbKb9u4mSg_CPp0Z0vNJLhoWgXA';

// Cache – max. 5 Minuten
let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

export async function ladeFeldStatus() {
  // Cache prüfen
  if (cache.data && (Date.now() - cache.timestamp) < CACHE_TTL) {
    return cache.data;
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Felder`;
    const response = await fetch(url);
    const text = await response.text();
    const json = JSON.parse(text.match(/setResponse\(([\s\S]*?)\);/)[1]);

    // Felder parsen: Spalte A=Feldnummer, G=Status, H=Branche
    const felder = [];
    json.table.rows.forEach(row => {
      const nr      = row.c[0]?.v?.toString().trim();
      const status  = row.c[6]?.v?.toString().trim() || 'free';
      const branche = row.c[7]?.v?.toString().trim() || '–';
      if (nr && nr !== 'Feldnummer') {
        felder.push(`${nr}:${status}:${branche}`);
      }
    });

    const result = felder.join('\n');
    cache = { data: result, timestamp: Date.now() };
    console.log(`✅ Feldstatus geladen: ${felder.length} Felder`);
    return result;

  } catch (error) {
    console.error('❌ Feldstatus konnte nicht geladen werden:', error);
    return '';
  }
}
