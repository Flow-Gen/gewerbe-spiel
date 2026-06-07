/**
 * Gewerbe-Spiel — Landingpage Tracking
 * 
 * Aufgaben:
 *  1. LID aus URL lesen (?lid=kn0042)
 *  2. Tracking-Event an n8n schicken (fire & forget)
 *  3. WhatsApp-Buttons mit LID-Marker erweitern
 * 
 * Funktioniert für alle Städte ohne Anpassung — Stadt wird aus URL gelesen.
 * Skript ist defensiv: bei Fehlern macht es nichts (kein Crash der LP).
 * 
 * Datenschutz: setzt keine Cookies, keinen LocalStorage.
 * Daten gehen direkt an eigenen n8n-Webhook, kein Third-Party-Tracking.
 */
(function () {
  'use strict';

  // ====== KONFIGURATION ======
  var WEBHOOK_URL = 'https://n8n.srv842714.hstgr.cloud/webhook/lp-tracking';
  
  // Zero-Width-Marker für unsichtbare LID-Einbettung in WhatsApp-Text
  // Das ist eine Reihe von unsichtbaren Unicode-Zeichen, die im Chat
  // nicht sichtbar sind, vom Bot aber gelesen werden können.
  var MARKER_START = '\u200B\u200C\u200B';  // ZWSP ZWNJ ZWSP
  var MARKER_END = '\u200B\u200D\u200B';    // ZWSP ZWJ ZWSP

  // ====== HELFER ======
  function getStadtFromUrl() {
    try {
      var path = window.location.pathname || '';
      // /konstanz, /loerrach, /konstanz/, etc.
      var parts = path.split('/').filter(function (s) { return s.length > 0; });
      return parts.length > 0 ? parts[parts.length - 1].toLowerCase() : 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  function getLidFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var lid = params.get('lid');
      // FIX: -? macht den Bindestrich optional → kn0042 UND kn-0042 beide gültig
      if (lid && /^[a-z]{2,4}-?\d{1,5}$/i.test(lid)) {
        return lid.toLowerCase();
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function sendTrackingEvent(payload) {
    try {
      // Prefer sendBeacon (überlebt Navigations-Wechsel und feuert garantiert)
      if (navigator.sendBeacon) {
        var blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
        navigator.sendBeacon(WEBHOOK_URL, blob);
        return;
      }
      // Fallback: klassischer fetch mit keepalive
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
        mode: 'no-cors'
      }).catch(function () { /* fail silent */ });
    } catch (e) {
      // Wir geben uns hier wirklich Mühe, nichts kaputt zu machen
    }
  }

  function tagWhatsAppLinks(lid) {
    try {
      var links = document.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
      links.forEach(function (link) {
        try {
          var url = new URL(link.href);
          var currentText = url.searchParams.get('text') || '';
          // LID als unsichtbaren Marker am Ende einbauen
          // Der Lead sieht: "Hallo, ich interessiere mich..."
          // Der Bot bekommt: "Hallo, ich interessiere mich...[INVISIBLE]kn0042[INVISIBLE]"
          var taggedText = currentText + MARKER_START + lid + MARKER_END;
          url.searchParams.set('text', taggedText);
          link.href = url.toString();
        } catch (e) {
          // einzelner Link kaputt → nächster
        }
      });
    } catch (e) {
      // gar nichts machen
    }
  }

  // ====== MAIN ======
  function init() {
    var lid = getLidFromUrl();
    var stadt = getStadtFromUrl();

    // Wenn keine LID, machen wir nichts. Page funktioniert normal.
    if (!lid) {
      return;
    }

    // 1. Tracking-Event senden
    sendTrackingEvent({
      lid: lid,
      stadt: stadt,
      event: 'lp_visit',
      ts: new Date().toISOString(),
      referrer: (document.referrer || '').substring(0, 200),
      userAgent: (navigator.userAgent || '').substring(0, 200),
      url: window.location.href.substring(0, 500),
      screen: (window.screen ? window.screen.width + 'x' + window.screen.height : '')
    });

    // 2. WhatsApp-Buttons mit LID erweitern
    // Wir warten bis DOM ready ist, falls Script im <head> liegt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        tagWhatsAppLinks(lid);
      });
    } else {
      tagWhatsAppLinks(lid);
    }
  }

  init();
})();
