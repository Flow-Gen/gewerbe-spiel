// ═══════════════════════════════════════════════════════════
// WhatsApp Cloud API – Nachrichten senden
// Datei: /lib/whatsapp.js
// ═══════════════════════════════════════════════════════════

export async function sendWhatsAppMessage(to, text) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp Sende-Fehler: ${error}`);
  }

  const data = await response.json();
  console.log(`✅ Nachricht gesendet an ${to}:`, data.messages?.[0]?.id);
  return data;
}

// Typing-Indikator senden (zeigt "tippt..." an)
export async function sendTypingIndicator(to, messageId) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;

  await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    }
  );
}
