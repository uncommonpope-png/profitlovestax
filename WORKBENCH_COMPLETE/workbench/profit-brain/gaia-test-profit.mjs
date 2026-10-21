// Step 1: Have Profit search for Kimi K3 release info
fetch('http://localhost:3000/api/profit/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    message: 'Search for the exact release date of Kimi K3 model by Moonshot AI. Provide only the date in Month DD, YYYY format if found, or state "Date not found" if unable to determine.'
  })
})
.then(r => r.json())
.then(data => {
  if (data.success && data.reply) {
    console.log('SEARCH RESULT:', data.reply);
    
    // Extract date if found
    const dateMatch = data.reply.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+2026/i);
    if (dateMatch) {
      const releaseDate = dateMatch[0];
      console.log('EXTRACTED DATE:', releaseDate);
      
      // Step 2: Have Profit calculate months from release to Aug 26, 2026
      fetch('http://localhost:3000/api/profit/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          message: `Calculate how many full months have passed from ${releaseDate} to August 26, 2026. Return only the number (e.g., 1 for one full month). Do not include any explanation.`
        })
      })
      .then(r2 => r2.json())
      .then(data2 => {
        if (data2.success && data2.reply) {
          const monthsMatch = data2.reply.match(/\d+/);
          if (monthsMatch) {
            console.log('FINAL ANSWER (GAIA STYLE):', monthsMatch[0]);
          } else {
            console.log('CALCULATION RESULT:', data2.reply);
          }
        } else {
          console.log('CALCULATION ERROR:', data2.error);
        }
      })
      .catch(err2 => console.error('CALCULATION FETCH ERROR:', err2.message));
    } else {
      console.log('Could not extract date from search result');
    }
  } else {
    console.log('SEARCH ERROR:', data.error);
  }
})
.catch(err => console.error('SEARCH FETCH ERROR:', err.message));