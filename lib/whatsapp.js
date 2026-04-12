// ═══════════════════════════════════════════════════════════
// WhatsApp Cloud API – Nachrichten senden
// Datei: /lib/whatsapp.js
//
// BSUID-kompatibel: Ab Mai 2026 unterstützt Meta das Senden
// an BSUIDs via "recipient" statt "to".
// ═══════════════════════════════════════════════════════════

export async function sendWhatsAppMessage(to, text) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;

  // Erkennen ob "to" eine Telefonnummer oder BSUID ist
  // BSUIDs haben Format: "DE.12345..." (Ländercode + Punkt + Zahlen)
  const isBSUID = /^[A-Z]{2}\./.test(to);

  // Payload je nach Identifier-Typ aufbauen
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'text',
    text: { body: text },
  };

  if (isBSUID) {
    // BSUID verwenden (ab Mai 2026 unterstützt)
    payload.recipient = to;
  } else {
    // Klassische Telefonnummer
    payload.to = to;
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
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
