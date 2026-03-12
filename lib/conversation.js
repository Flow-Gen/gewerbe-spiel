// ═══════════════════════════════════════════════════════════
// Gesprächsverlauf – Speichert Kontext pro Nutzer
// Datei: /lib/conversation.js
// Nutzt Vercel KV (kostenlos bis 30.000 Befehle/Monat)
// ═══════════════════════════════════════════════════════════

// Vercel KV wird über Umgebungsvariablen automatisch verbunden
// Falls KV nicht verfügbar: Fallback auf In-Memory (nur für Tests)
let kv;
try {
  const kvModule = await import('@vercel/kv');
  kv = kvModule.kv;
} catch {
  console.warn('⚠️ Vercel KV nicht verfügbar – nutze In-Memory Fallback');
  kv = null;
}

// In-Memory Fallback (nur für lokale Entwicklung)
const memoryStore = new Map();

const HISTORY_TTL = 60 * 60 * 24; // 24 Stunden in Sekunden
const KEY_PREFIX  = 'chat:';

export async function getConversationHistory(userId) {
  const key = `${KEY_PREFIX}${userId}`;
  try {
    if (kv) {
      const data = await kv.get(key);
      return data || { messages: [], lastActivity: Date.now() };
    } else {
      return memoryStore.get(key) || { messages: [], lastActivity: Date.now() };
    }
  } catch (error) {
    console.error('Fehler beim Laden der History:', error);
    return { messages: [], lastActivity: Date.now() };
  }
}

export async function saveConversationHistory(userId, history) {
  const key = `${KEY_PREFIX}${userId}`;
  try {
    if (kv) {
      await kv.set(key, history, { ex: HISTORY_TTL });
    } else {
      memoryStore.set(key, history);
      // Memory cleanup nach 24h
      setTimeout(() => memoryStore.delete(key), HISTORY_TTL * 1000);
    }
  } catch (error) {
    console.error('Fehler beim Speichern der History:', error);
  }
}

// Lead-Daten aus dem Gesprächsverlauf extrahieren
// Der KI-Prompt fügt [LEAD:name=...|firma=...|branche=...|interesse=...] ein
export function extractLeadData(history) {
  const messages = history.messages || [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'assistant') {
      const match = msg.content.match(/\[LEAD:([^\]]+)\]/);
      if (match) {
        const parts = match[1].split('|');
        const data  = {};
        parts.forEach(part => {
          const [key, value] = part.split('=');
          if (key && value) data[key.trim()] = value.trim();
        });
        return {
          name:        data.name        || '',
          firma:       data.firma       || '',
          branche:     data.branche     || '',
          interesse:   data.interesse   || '',
          gespeichert: history._leadGespeichert || false,
        };
      }
    }
  }

  return { name: '', firma: '', branche: '', interesse: '', gespeichert: false };
}
