const fetch = require('node-fetch');

const message = 'Examine the Internet tab in the Workbench (src/components/InternetTab.tsx). Identify ONE specific, concrete improvement that would make it more valuable for users (not just cosmetic). Implement that improvement by providing the exact code changes needed. Focus on functionality, not appearance. Return ONLY the file path and the exact changes in a format that can be directly applied.';

fetch('http://localhost:3000/api/profit/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ message })
})
.then(r => r.json())
.then(data => {
  if (data.success && data.reply) {
    console.log('PROFIT\\'S IMPROVEMENT PROPOSAL:');
    console.log('====================================');
    console.log(data.reply);
    console.log('====================================');
  } else {
    console.log('ERROR:', data.error);
  }
})
.catch(err => console.error('FETCH ERROR:', err.message));