const { web_fetch } = require('../utils/web_fetch');
const { scribe } = require('../utils/scribe');

async function execute(input) {
  try {
    const response = await web_fetch(`https://api.example.com/ai-agent-architectures?query=${encodeURIComponent(input)}`);
    const data = JSON.parse(response);

    const insights = data.insights.map(insight => ({
      title: insight.title,
      summary: insight.summary,
      url: insight.url
    }));

    const report = {
      query: input,
      insights: insights,
      timestamp: new Date().toISOString()
    };

    await scribe('auto_1783986748930', report);

    return JSON.stringify(report, null, 2);
  } catch (error) {
    console.error('Error fetching AI agent architectures:', error);
    return 'Error fetching AI agent architectures';
  }
}

module.exports = { execute };
