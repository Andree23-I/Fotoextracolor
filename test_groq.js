import fs from 'fs';
import path from 'path';

// Carica variabili da .env se presente
if (fs.existsSync('.env') && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env');
  } catch (e) {}
}

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.log("Nessuna GROQ_API_KEY trovata nel file .env o nell'ambiente.");
  console.log("Aggiungi la chiave in .env (es. GROQ_API_KEY=gsk_...) oppure configurala nel pannello admin.");
  process.exit(1);
}

async function test() {
  console.log("Test connessione Groq API con modello llama-3.3-70b-versatile...");
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Ciao, sei attivo?' }],
        max_tokens: 50
      })
    });
    const data = await res.json();
    console.log("Risposta API:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Errore chiamata Groq:", err);
  }
}

test();
