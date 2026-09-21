async function test() {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer INSERISCI_QUI_LA_TUA_CHIAVE',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: 'Ciao' }]
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
