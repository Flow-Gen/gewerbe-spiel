// ═══════════════════════════════════════════════════════════
// Gewerbe-Spiel WhatsApp Bot – Vercel API Route
// Datei: /api/webhook.js
// ═══════════════════════════════════════════════════════════

import { getAIResponse } from '../lib/openai.js';
import { saveLeadToSheets } from '../lib/sheets.js';
import { sendWhatsAppMessage } from '../lib/whatsapp.js';
import { getConversationHistory, saveConversationHistory, extractLeadData } from '../lib/conversation.js';

export default async function handler(req, res) {

  // ── GET: Meta Webhook Verifikation ──────────────────────
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ Webhook verifiziert');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // ── POST: Eingehende WhatsApp-Nachricht ─────────────────
  if (req.method === 'POST') {
    // Sofort 200 zurückgeben (Meta erwartet schnelle Antwort)
    res.status(200).json({ status: 'ok' });

    try {
      const body = req.body;

      // Prüfen ob es eine echte Nachricht ist
      if (
        body.object !== 'whatsapp_business_account' ||
        !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
      ) {
        return;
      }

      const value   = body.entry[0].changes[0].value;
      const message = value.messages[0];
      const from    = message.from; // Telefonnummer des Absenders
      const msgType = message.type;

      // Nur Text-Nachrichten verarbeiten
      if (msgType !== 'text') {
        await sendWhatsAppMessage(from,
          'Ich kann leider nur Text-Nachrichten verarbeiten. Bitte schreib mir einfach, was dich interessiert! 😊'
        );
        return;
      }

      const userText = message.text.body;
      console.log(`📩 Nachricht von ${from}: ${userText}`);

      // Gesprächsverlauf laden
      const history = await getConversationHistory(from);

      // KI-Antwort holen
      const { reply, updatedHistory } = await getAIResponse(userText, history, from);

      // Lead-Daten aus dem Gespräch extrahieren
      const leadData = extractLeadData(updatedHistory);

      // Lead speichern wenn qualifiziert (Name + Firma vorhanden)
      if (leadData.name && leadData.firma && !leadData.gespeichert) {
        await saveLeadToSheets({
          ...leadData,
          telefon: from,
          datum: new Date().toISOString(),
        });
        // Markieren dass Lead gespeichert wurde
        updatedHistory._leadGespeichert = true;
      }

      // Gesprächsverlauf speichern
      await saveConversationHistory(from, updatedHistory);

      // Antwort senden
      await sendWhatsAppMessage(from, reply);

    } catch (error) {
      console.error('❌ Fehler im Webhook:', error);
    }

    return;
  }

  res.status(405).send('Method Not Allowed');
}
