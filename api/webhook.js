import { getAIResponse, extractLeadTag, extractReservierungTag, extractRueckfrageTag, extractWartelisteTag } from '../lib/openai.js';
import { saveLeadToSheets, reservieresFeld, sendeRueckfrage, sendeWarteliste } from '../lib/sheets.js';
import { sendWhatsAppMessage } from '../lib/whatsapp.js';
import { getConversationHistory, saveConversationHistory } from '../lib/conversation.js';
import { ladeFeldStatus } from '../lib/felder.js';

export default async function handler(req, res) {

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  if (req.method === 'POST') {
    res.status(200).json({ status: 'ok' });

    try {
      const body = req.body;
      if (
        body.object !== 'whatsapp_business_account' ||
        !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
      ) return;

      const value   = body.entry[0].changes[0].value;
      const message = value.messages[0];
      const msgType = message.type;

      // BSUID-kompatibel
      const from = message.from
                || message.from_user_id
                || value.contacts?.[0]?.user_id
                || value.contacts?.[0]?.wa_id;

      if (!from) return;

      if (msgType !== 'text') {
        await sendWhatsAppMessage(from, 'Ich kann leider nur Text-Nachrichten verarbeiten. Bitte schreib mir einfach, was dich interessiert! 😊');
        return;
      }

      const userText = message.text.body;
      const history  = await getConversationHistory(from);
      const feldStatus = await ladeFeldStatus();
      const { reply, rawReply, updatedHistory } = await getAIResponse(userText, history, from, feldStatus);

      // 1. Lead speichern
      const leadData = extractLeadTag(rawReply);
      if (leadData && !history._leadGespeichert) {
        await saveLeadToSheets({ ...leadData, telefon: from, status: 'Interesse' });
        updatedHistory._leadGespeichert = true;
      }

      // 2. Reservierung
      const reservierung = extractReservierungTag(rawReply);
      if (reservierung && !history._reservierungGesendet) {
        await reservieresFeld({ ...reservierung, telefon: from });
        updatedHistory._reservierungGesendet = true;
      }

      // 3. Rückfrage an Admin (Branche unklar)
      const rueckfrage = extractRueckfrageTag(rawReply);
      if (rueckfrage && !history._rueckfrageGesendet) {
        await sendeRueckfrage({ ...rueckfrage, telefon: from });
        updatedHistory._rueckfrageGesendet = true;
      }

      // 4. Warteliste (Branche vergeben, andere Städte)
      const warteliste = extractWartelisteTag(rawReply);
      if (warteliste && !history._wartelisteGesendet) {
        await sendeWarteliste({ ...warteliste, telefon: from });
        updatedHistory._wartelisteGesendet = true;
      }

      await saveConversationHistory(from, updatedHistory);
      await sendWhatsAppMessage(from, reply);

    } catch (error) {
      console.error('❌ Fehler:', error);
    }
    return;
  }

  res.status(405).send('Method Not Allowed');
}
