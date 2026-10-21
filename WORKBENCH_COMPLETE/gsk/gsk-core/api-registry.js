const http = require('http');
const https = require('https');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        const req = mod.get(url, { timeout: 10000, headers: { 'User-Agent': 'BrainInABox/1.0' } }, (res) => {
            let data = '';
            res.on('data', c => { data += c; if (data.length > 2e6) { req.destroy(); reject(new Error('Response too large')); } });
            res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

const CATEGORIES = {
    llm: { name: 'Large Language Models', icon: '🧠' },
    search: { name: 'Search Engines', icon: '🔍' },
    weather: { name: 'Weather & Climate', icon: '🌤️' },
    finance: { name: 'Finance & Crypto', icon: '💰' },
    news: { name: 'News & Media', icon: '📰' },
    reference: { name: 'Reference & Data', icon: '📚' },
    ai: { name: 'AI & Machine Learning', icon: '🤖' },
    science: { name: 'Science & Space', icon: '🔬' },
    geography: { name: 'Geography & Maps', icon: '🗺️' },
    images: { name: 'Images & Art', icon: '🖼️' },
    music: { name: 'Music & Audio', icon: '🎵' },
    video: { name: 'Video & Streaming', icon: '🎬' },
    games: { name: 'Games & Comics', icon: '🎮' },
    social: { name: 'Social Media', icon: '💬' },
    health: { name: 'Health & Fitness', icon: '💪' },
    food: { name: 'Food & Drink', icon: '🍔' },
    shopping: { name: 'Shopping & Products', icon: '🛒' },
    development: { name: 'Development & Tools', icon: '💻' },
    security: { name: 'Security & Privacy', icon: '🔒' },
    transport: { name: 'Transportation', icon: '✈️' },
    government: { name: 'Government & Data', icon: '🏛️' },
    environment: { name: 'Environment & Nature', icon: '🌿' },
    education: { name: 'Education & Learning', icon: '📖' },
    entertainment: { name: 'Entertainment', icon: '🎭' },
    business: { name: 'Business & Jobs', icon: '💼' },
    communication: { name: 'Communication', icon: '📡' },
    analytics: { name: 'Analytics & Tracking', icon: '📊' },
    storage: { name: 'Storage & Files', icon: '💾' },
    hardware: { name: 'Hardware & IoT', icon: '🔧' },
    sports: { name: 'Sports & Fitness', icon: '⚽' }
};

const API_REGISTRY = [
    // ===== LLM APIs (15+) =====
    { id: 'gemini-flash', name: 'Gemini 2.5 Flash', category: 'llm', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', auth: 'key', keyEnv: 'GEMINI_API_KEY', free: true, limit: '1500 req/day', desc: 'Google\'s frontier model, 1M context, multimodal' },
    { id: 'gemini-pro', name: 'Gemini 2.5 Pro', category: 'llm', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent', auth: 'key', keyEnv: 'GEMINI_API_KEY', free: true, limit: '25 req/day', desc: 'Google\'s best model, reasoning focused' },
    { id: 'groq-llama', name: 'Groq Llama 3.3 70B', category: 'llm', url: 'https://api.groq.com/openai/v1/chat/completions', auth: 'key', keyEnv: 'GROQ_API_KEY', free: true, limit: '30 req/min 14k/day', desc: '700+ tokens/sec on Llama 3.3 70B' },
    { id: 'groq-mixtral', name: 'Groq Mixtral 8x7B', category: 'llm', url: 'https://api.groq.com/openai/v1/chat/completions', auth: 'key', keyEnv: 'GROQ_API_KEY', free: true, limit: '30 req/min', desc: 'Mistral MoE on Groq LPU' },
    { id: 'groq-gemma', name: 'Groq Gemma 2 9B', category: 'llm', url: 'https://api.groq.com/openai/v1/chat/completions', auth: 'key', keyEnv: 'GROQ_API_KEY', free: true, limit: '30 req/min', desc: 'Google Gemma 2 on Groq' },
    { id: 'openrouter', name: 'OpenRouter Free', category: 'llm', url: 'https://openrouter.ai/api/v1/chat/completions', auth: 'key', keyEnv: 'OPENROUTER_API_KEY', free: true, limit: '50 req/day', desc: '11+ free models: Gemini 2.0 Flash, Llama 3.3, DeepSeek R1, Phi-3, Mistral, Qwen' },
    { id: 'openrouter-community', name: 'OpenRouter Community', category: 'llm', url: 'https://openrouter.ai/api/v1/chat/completions', auth: 'none', free: true, limit: 'Shared', desc: 'Community key for free models, rate limited' },
    { id: 'cerebras-llama', name: 'Cerebras Llama 3.3 70B', category: 'llm', url: 'https://api.cerebras.ai/v1/chat/completions', auth: 'key', keyEnv: 'CEREBRAS_API_KEY', free: true, limit: '1700 req/day 1000 TPS', desc: 'Fastest inference at ~1000 tokens/sec' },
    { id: 'cerebras-8b', name: 'Cerebras Llama 3.1 8B', category: 'llm', url: 'https://api.cerebras.ai/v1/chat/completions', auth: 'key', keyEnv: 'CEREBRAS_API_KEY', free: true, limit: '1700 req/day', desc: 'Smaller faster model on Cerebras' },
    { id: 'sambanova-llama', name: 'SambaNova Llama 3.3 70B', category: 'llm', url: 'https://api.sambanova.ai/v1/chat/completions', auth: 'key', keyEnv: 'SAMBANOVA_API_KEY', free: true, limit: '294 TPS', desc: 'Groq alternative with similar speed' },
    { id: 'mistral-small', name: 'Mistral Small', category: 'llm', url: 'https://api.mistral.ai/v1/chat/completions', auth: 'key', keyEnv: 'MISTRAL_API_KEY', free: true, limit: '86K req/day', desc: 'Mistral Small 4, 256K context' },
    { id: 'mistral-medium', name: 'Mistral Medium', category: 'llm', url: 'https://api.mistral.ai/v1/chat/completions', auth: 'key', keyEnv: 'MISTRAL_API_KEY', free: true, limit: '86K req/day', desc: 'Mistral Medium 3, 128K context' },
    { id: 'mistral-large', name: 'Mistral Large', category: 'llm', url: 'https://api.mistral.ai/v1/chat/completions', auth: 'key', keyEnv: 'MISTRAL_API_KEY', free: true, limit: '86K req/day', desc: 'Mistral Large 3, 256K context' },
    { id: 'huggingface-mistral', name: 'HuggingFace Mistral 7B', category: 'llm', url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Mistral 7B via HF Inference' },
    { id: 'huggingface-llama', name: 'HuggingFace Llama 3.2 3B', category: 'llm', url: 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Llama 3.2 3B via HF' },
    { id: 'huggingface-zephyr', name: 'HuggingFace Zephyr 7B', category: 'llm', url: 'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Zephyr 7B beta via HF' },
    { id: 'huggingface-phi', name: 'HuggingFace Phi-3 Mini', category: 'llm', url: 'https://api-inference.huggingface.co/models/microsoft/phi-3-mini-128k-instruct', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Phi-3 Mini 128K via HF' },
    { id: 'huggingface-hermes', name: 'HuggingFace Hermes 2 Pro', category: 'llm', url: 'https://api-inference.huggingface.co/models/NousResearch/Hermes-2-Pro-Mistral-7B', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Nous Hermes 2 Pro Mistral 7B' },
    { id: 'cloudflare-llama', name: 'Cloudflare Llama 3.3 70B', category: 'llm', url: 'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.3-70b-instruct', auth: 'key', keyEnv: 'CLOUDFLARE_API_KEY', free: true, limit: '300 req/day', desc: 'Llama via Cloudflare Workers AI' },
    { id: 'nvidia-nemotron', name: 'NVIDIA Nemotron 70B', category: 'llm', url: 'https://api.nvcf.nvidia.com/v2/nvcf/pexec/functions/{function_id}', auth: 'key', keyEnv: 'NVIDIA_API_KEY', free: true, limit: '1000 credits free', desc: 'NVIDIA NIM Llama 3.1 Nemotron 70B' },
    { id: 'github-models', name: 'GitHub Models GPT-4o', category: 'llm', url: 'https://models.inference.ai.azure.com/chat/completions', auth: 'key', keyEnv: 'GITHUB_TOKEN', free: true, limit: '150 req/day', desc: 'GPT-4o, Llama 3.1 via GitHub' },
    { id: 'cohere-command', name: 'Cohere Command R+', category: 'llm', url: 'https://api.cohere.com/v2/chat', auth: 'key', keyEnv: 'COHERE_API_KEY', free: true, limit: '33 req/day', desc: 'Command R+ for RAG workflows' },

    // ===== SEARCH APIs (10+) =====
    { id: 'duckduckgo', name: 'DuckDuckGo Instant Answer', category: 'search', url: 'https://api.duckduckgo.com/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Instant answers, definitions, topics' },
    { id: 'duckduckgo-html', name: 'DuckDuckGo HTML Search', category: 'search', url: 'https://html.duckduckgo.com/html/', auth: 'none', free: true, limit: 'Rate limited', desc: 'HTML search results scraping' },
    { id: 'wikipedia-search', name: 'Wikipedia Search', category: 'search', url: 'https://en.wikipedia.org/w/api.php', auth: 'none', free: true, limit: '200 req/s', desc: 'Wikipedia full text search' },
    { id: 'wikidata', name: 'Wikidata Query', category: 'search', url: 'https://www.wikidata.org/w/api.php', auth: 'none', free: true, limit: '200 req/s', desc: 'Structured data from Wikidata' },
    { id: 'google-custom', name: 'Google Custom Search', category: 'search', url: 'https://www.googleapis.com/customsearch/v1', auth: 'key', keyEnv: 'GOOGLE_API_KEY', free: true, limit: '100 req/day', desc: 'Google search with Custom Search Engine' },
    { id: 'bing-search', name: 'Bing Web Search', category: 'search', url: 'https://api.bing.microsoft.com/v7.0/search', auth: 'key', keyEnv: 'BING_API_KEY', free: true, limit: '1000 req/month', desc: 'Microsoft Bing search results' },
    { id: 'serpapi', name: 'SerpAPI Google Search', category: 'search', url: 'https://serpapi.com/search', auth: 'key', keyEnv: 'SERPAPI_KEY', free: true, limit: '100 req/month', desc: 'Google search results API' },
    { id: 'searchapi', name: 'SearchAPI.io', category: 'search', url: 'https://www.searchapi.io/api/v1/search', auth: 'key', keyEnv: 'SEARCHAPI_KEY', free: true, limit: '100 req/month', desc: 'Multi-engine search API' },
    { id: 'searxng', name: 'SearXNG Public', category: 'search', url: 'https://searx.be/search', auth: 'none', free: true, limit: 'Rate limited', desc: 'Privacy-focused meta search engine' },

    // ===== WEATHER APIs (15+) =====
    { id: 'open-meteo', name: 'Open-Meteo Weather', category: 'weather', url: 'https://api.open-meteo.com/v1/forecast', auth: 'none', free: true, limit: '10000 req/day', desc: 'Free weather forecasts, historical data' },
    { id: 'open-meteo-air', name: 'Open-Meteo Air Quality', category: 'weather', url: 'https://air-quality-api.open-meteo.com/v1/air-quality', auth: 'none', free: true, limit: '10000 req/day', desc: 'Air quality index and pollutants' },
    { id: 'open-meteo-geo', name: 'Open-Meteo Geocoding', category: 'weather', url: 'https://geocoding-api.open-meteo.com/v1/search', auth: 'none', free: true, limit: '10000 req/day', desc: 'City name to coordinates' },
    { id: 'open-meteo-marine', name: 'Open-Meteo Marine', category: 'weather', url: 'https://marine-api.open-meteo.com/v1/marine', auth: 'none', free: true, limit: '10000 req/day', desc: 'Ocean wave and water data' },
    { id: 'weather-gov', name: 'US National Weather Service', category: 'weather', url: 'https://api.weather.gov/points/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Official US weather forecasts, alerts' },
    { id: 'noaa-forecast', name: 'NOAA Weather Forecast', category: 'weather', url: 'https://graphical.weather.gov/xml/SOAP_server/ndfdXMLclient.php', auth: 'none', free: true, limit: 'Unlimited', desc: 'NOAA digital forecast database' },
    { id: 'visual-crossing', name: 'Visual Crossing Weather', category: 'weather', url: 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/', auth: 'key', keyEnv: 'VISUALCROSSING_KEY', free: true, limit: '1000 req/day', desc: 'Historical weather and forecast data' },
    { id: 'weatherapi', name: 'WeatherAPI.com', category: 'weather', url: 'https://api.weatherapi.com/v1', auth: 'key', keyEnv: 'WEATHERAPI_KEY', free: true, limit: '1M req/month', desc: 'Current, forecast, history, astronomy, time zone' },
    { id: 'tomorrow-io', name: 'Tomorrow.io Weather', category: 'weather', url: 'https://api.tomorrow.io/v4/timelines', auth: 'key', keyEnv: 'TOMORROW_API_KEY', free: true, limit: '500 req/day', desc: 'Hyper-local weather forecasts' },
    { id: 'openweather', name: 'OpenWeatherMap', category: 'weather', url: 'https://api.openweathermap.org/data/2.5/weather', auth: 'key', keyEnv: 'OPENWEATHER_KEY', free: true, limit: '60 req/min', desc: 'Current weather for any location' },
    { id: 'accuweather', name: 'AccuWeather Location', category: 'weather', url: 'https://dataservice.accuweather.com/locations/v1/search', auth: 'key', keyEnv: 'ACCUWEATHER_KEY', free: true, limit: '50 req/day', desc: 'AccuWeather location search' },

    // ===== FINANCE APIs (25+) =====
    { id: 'coingecko', name: 'CoinGecko Crypto', category: 'finance', url: 'https://api.coingecko.com/api/v3/simple/price', auth: 'none', free: true, limit: '50 req/min', desc: 'Cryptocurrency prices, market data' },
    { id: 'coingecko-trending', name: 'CoinGecko Trending', category: 'finance', url: 'https://api.coingecko.com/api/v3/search/trending', auth: 'none', free: true, limit: '50 req/min', desc: 'Trending crypto searches' },
    { id: 'coingecko-global', name: 'CoinGecko Global', category: 'finance', url: 'https://api.coingecko.com/api/v3/global', auth: 'none', free: true, limit: '50 req/min', desc: 'Global crypto market data' },
    { id: 'coinmarketcap', name: 'CoinMarketCap', category: 'finance', url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', auth: 'key', keyEnv: 'CMC_API_KEY', free: true, limit: '333 req/day', desc: 'Crypto market cap rankings' },
    { id: 'coinbase', name: 'Coinbase Prices', category: 'finance', url: 'https://api.coinbase.com/v2/prices', auth: 'none', free: true, limit: 'Unlimited', desc: 'Coinbase spot prices' },
    { id: 'binance', name: 'Binance Ticker', category: 'finance', url: 'https://api.binance.com/api/v3/ticker/24hr', auth: 'none', free: true, limit: '1200 req/min', desc: 'Binance exchange rates and ticker' },
    { id: 'yahoo-finance', name: 'Yahoo Finance Quote', category: 'finance', url: 'https://query1.finance.yahoo.com/v8/finance/chart/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Stock quotes and chart data' },
    { id: 'yahoo-finance-search', name: 'Yahoo Finance Search', category: 'finance', url: 'https://query1.finance.yahoo.com/v1/finance/search', auth: 'none', free: true, limit: 'Rate limited', desc: 'Search Yahoo Finance symbols' },
    { id: 'alphavantage', name: 'Alpha Vantage Stocks', category: 'finance', url: 'https://www.alphavantage.co/query', auth: 'key', keyEnv: 'ALPHAVANTAGE_KEY', free: true, limit: '25 req/day', desc: 'Stock prices, forex, crypto, indicators' },
    { id: 'alphavantage-forex', name: 'Alpha Vantage Forex', category: 'finance', url: 'https://www.alphavantage.co/query', auth: 'key', keyEnv: 'ALPHAVANTAGE_KEY', free: true, limit: '25 req/day', desc: 'Currency exchange rates' },
    { id: 'exchangerate-api', name: 'ExchangeRate-API', category: 'finance', url: 'https://api.exchangerate-api.com/v4/latest/', auth: 'none', free: true, limit: '1500 req/month', desc: 'Currency conversion rates' },
    { id: 'frankfurter', name: 'Frankfurter FX', category: 'finance', url: 'https://api.frankfurter.dev/latest', auth: 'none', free: true, limit: 'Unlimited', desc: 'European Central Bank exchange rates' },
    { id: 'exchangerate-host', name: 'ExchangeRate.host', category: 'finance', url: 'https://api.exchangerate.host/latest', auth: 'none', free: true, limit: 'Unlimited', desc: 'Free currency exchange rates' },
    { id: 'iexcloud', name: 'IEX Cloud Stocks', category: 'finance', url: 'https://cloud.iexapis.com/stable/stock/', auth: 'key', keyEnv: 'IEX_API_KEY', free: true, limit: '50000 req/month', desc: 'Stock market data and quotes' },
    { id: 'finhub', name: 'Finnhub Stock', category: 'finance', url: 'https://finnhub.io/api/v1/quote', auth: 'key', keyEnv: 'FINNHUB_KEY', free: true, limit: '300 req/min', desc: 'Real-time stock quotes, news, fundamentals' },
    { id: 'polygon', name: 'Polygon.io Stocks', category: 'finance', url: 'https://api.polygon.io/v2/aggs/ticker/', auth: 'key', keyEnv: 'POLYGON_KEY', free: true, limit: '5 req/min', desc: 'Stock aggregates and OHLCV data' },
    { id: 'twelvedata', name: 'Twelve Data Stocks', category: 'finance', url: 'https://api.twelvedata.com/quote', auth: 'key', keyEnv: 'TWELVEDATA_KEY', free: true, limit: '800 req/day', desc: 'Real-time stock, forex, crypto' },
    { id: 'stripe', name: 'Stripe Balance', category: 'finance', url: 'https://api.stripe.com/v1/balance', auth: 'key', keyEnv: 'STRIPE_KEY', free: true, limit: 'Unlimited', desc: 'Stripe account balance' },
    { id: 'ethereum', name: 'Ethereum Node', category: 'finance', url: 'https://ethereum-rpc.publicnode.com', auth: 'none', free: true, limit: '100 req/sec', desc: 'Public Ethereum RPC endpoint' },
    { id: 'solana', name: 'Solana RPC', category: 'finance', url: 'https://api.mainnet-beta.solana.com', auth: 'none', free: true, limit: '100 req/5min', desc: 'Solana blockchain RPC' },
    { id: 'polygon-rpc', name: 'Polygon RPC', category: 'finance', url: 'https://polygon-rpc.com', auth: 'none', free: true, limit: 'Rate limited', desc: 'Polygon (MATIC) public RPC' },
    { id: 'blockchain-info', name: 'Blockchain.info', category: 'finance', url: 'https://blockchain.info/ticker', auth: 'none', free: true, limit: 'Unlimited', desc: 'Bitcoin price and blockchain data' },
    { id: 'mempool', name: 'Mempool.space', category: 'finance', url: 'https://mempool.space/api/blocks/tip/height', auth: 'none', free: true, limit: 'Rate limited', desc: 'Bitcoin mempool and blockchain' },
    { id: 'defillama', name: 'DefiLlama', category: 'finance', url: 'https://api.llama.fi/protocols', auth: 'none', free: true, limit: 'Rate limited', desc: 'DeFi protocol TVL data' },
    { id: 'world-bank', name: 'World Bank Indicators', category: 'finance', url: 'https://api.worldbank.org/v2/country/all/indicator/', auth: 'none', free: true, limit: 'Unlimited', desc: 'World economic indicators' },
    { id: 'imf-data', name: 'IMF Data', category: 'finance', url: 'http://dataservices.imf.org/REST/SDMX_JSON.svc/', auth: 'none', free: true, limit: 'Unlimited', desc: 'International Monetary Fund data' },

    // ===== NEWS APIs (15+) =====
    { id: 'newsapi', name: 'NewsAPI.org', category: 'news', url: 'https://newsapi.org/v2/top-headlines', auth: 'key', keyEnv: 'NEWSAPI_KEY', free: true, limit: '100 req/day', desc: 'Top headlines from major news sources' },
    { id: 'guardian', name: 'The Guardian', category: 'news', url: 'https://content.guardianapis.com/search', auth: 'key', keyEnv: 'GUARDIAN_KEY', free: true, limit: 'Unlimited', desc: 'Guardian news articles' },
    { id: 'nyt', name: 'New York Times', category: 'news', url: 'https://api.nytimes.com/svc/topstories/v2/', auth: 'key', keyEnv: 'NYT_KEY', free: true, limit: '500 req/day', desc: 'NYT top stories and articles' },
    { id: 'hackernews', name: 'Hacker News', category: 'news', url: 'https://hacker-news.firebaseio.com/v0/topstories.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Y Combinator Hacker News stories' },
    { id: 'hackernews-item', name: 'Hacker News Item', category: 'news', url: 'https://hacker-news.firebaseio.com/v0/item/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Individual HN item details' },
    { id: 'reddit-hot', name: 'Reddit Hot Posts', category: 'news', url: 'https://www.reddit.com/r/all/hot.json', auth: 'none', free: true, limit: '60 req/min', desc: 'Reddit trending posts' },
    { id: 'reddit-search', name: 'Reddit Search', category: 'news', url: 'https://www.reddit.com/search.json', auth: 'none', free: true, limit: '60 req/min', desc: 'Search Reddit posts and comments' },
    { id: 'gnews', name: 'GNews API', category: 'news', url: 'https://gnews.io/api/v4/top-headlines', auth: 'key', keyEnv: 'GNEWS_KEY', free: true, limit: '100 req/day', desc: 'Google News aggregated headlines' },
    { id: 'newsdata', name: 'NewsData.io', category: 'news', url: 'https://newsdata.io/api/1/news', auth: 'key', keyEnv: 'NEWSDATA_KEY', free: true, limit: '200 req/day', desc: 'Breaking news from 80+ countries' },
    { id: 'mediastack', name: 'Mediastack', category: 'news', url: 'https://api.mediastack.com/v1/news', auth: 'key', keyEnv: 'MEDIASTACK_KEY', free: true, limit: '500 req/month', desc: 'Real-time news from 7500+ sources' },
    { id: 'rss2json', name: 'RSS to JSON', category: 'news', url: 'https://api.rss2json.com/v1/api.json', auth: 'none', free: true, limit: 'Rate limited', desc: 'Convert any RSS feed to JSON' },
    { id: 'lobsters', name: 'Lobste.rs', category: 'news', url: 'https://lobste.rs/hottest.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Tech news from Lobsters community' },
    { id: 'reliefweb', name: 'ReliefWeb', category: 'news', url: 'https://api.reliefweb.int/v1/reports', auth: 'none', free: true, limit: 'Unlimited', desc: 'Humanitarian crisis news' },
    { id: 'spaceflightnews', name: 'Spaceflight News', category: 'news', url: 'https://api.spaceflightnewsapi.net/v4/articles/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Space and astronomy news' },

    // ===== REFERENCE APIs (30+) =====
    { id: 'rest-countries', name: 'REST Countries', category: 'reference', url: 'https://restcountries.com/v3.1/all', auth: 'none', free: true, limit: 'Unlimited', desc: 'Country data: name, flag, capital, population, currency, language' },
    { id: 'rest-countries-name', name: 'REST Countries by Name', category: 'reference', url: 'https://restcountries.com/v3.1/name/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Search countries by name' },
    { id: 'rest-countries-code', name: 'REST Countries by Code', category: 'reference', url: 'https://restcountries.com/v3.1/alpha/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Search countries by code' },
    { id: 'ip-api', name: 'IP-API.com', category: 'reference', url: 'https://ip-api.com/json/', auth: 'none', free: true, limit: '45 req/min', desc: 'IP geolocation: country, city, ISP, lat/lon' },
    { id: 'ipwhois', name: 'IPWhois.io', category: 'reference', url: 'https://ipwhois.io/json/', auth: 'none', free: true, limit: '10000 req/month', desc: 'IP geolocation and intelligence' },
    { id: 'abstract-ip', name: 'Abstract API IP', category: 'reference', url: 'https://ipgeolocation.abstractapi.com/v1/', auth: 'key', keyEnv: 'ABSTRACT_KEY', free: true, limit: '20000 req/month', desc: 'IP geolocation details' },
    { id: 'ipinfo', name: 'IPinfo.io', category: 'reference', url: 'https://ipinfo.io/json', auth: 'none', free: true, limit: '50000 req/month', desc: 'IP address data: location, ASN, company' },
    { id: 'wikidata-entity', name: 'Wikidata Entity', category: 'reference', url: 'https://www.wikidata.org/wiki/Special:EntityData/', auth: 'none', free: true, limit: '200 req/s', desc: 'Wikidata entity lookup by Q-ID' },
    { id: 'wikidata-sparql', name: 'Wikidata SPARQL', category: 'reference', url: 'https://query.wikidata.org/sparql', auth: 'none', free: true, limit: 'Rate limited', desc: 'SPARQL query against Wikidata' },
    { id: 'wikipedia-summary', name: 'Wikipedia Summary', category: 'reference', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/', auth: 'none', free: true, limit: '200 req/s', desc: 'Wikipedia article summaries' },
    { id: 'wikipedia-extract', name: 'Wikipedia Extract', category: 'reference', url: 'https://en.wikipedia.org/w/api.php', auth: 'none', free: true, limit: '200 req/s', desc: 'Full Wikipedia article text' },
    { id: 'wiktionary', name: 'Wiktionary Definition', category: 'reference', url: 'https://en.wiktionary.org/api/rest_v1/page/definition/', auth: 'none', free: true, limit: '200 req/s', desc: 'Word definitions from Wiktionary' },
    { id: 'dictionary-api', name: 'Free Dictionary API', category: 'reference', url: 'https://api.dictionaryapi.dev/api/v2/entries/en/', auth: 'none', free: true, limit: 'Unlimited', desc: 'English word definitions, phonetics, examples' },
    { id: 'thesaurus', name: 'Words API Thesaurus', category: 'reference', url: 'https://wordsapiv1.p.rapidapi.com/words/', auth: 'key', keyEnv: 'WORDSAPI_KEY', free: true, limit: '2500 req/day', desc: 'Synonyms, antonyms, rhyming words' },
    { id: 'datamuse', name: 'Datamuse Words', category: 'reference', url: 'https://api.datamuse.com/words', auth: 'none', free: true, limit: '100000 req/day', desc: 'Word finding: rhymes, synonyms, related' },
    { id: 'numbersapi', name: 'Numbers API', category: 'reference', url: 'http://numbersapi.com/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Interesting facts about numbers and dates' },
    { id: 'bible-api', name: 'Bible API', category: 'reference', url: 'https://bible-api.com/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Bible verses and chapters' },
    { id: 'alquran', name: 'Al-Quran API', category: 'reference', url: 'https://api.alquran.cloud/v1/surah', auth: 'none', free: true, limit: 'Unlimited', desc: 'Quran text and translations' },
    { id: 'zipline', name: 'Zippopotamus Zip Codes', category: 'reference', url: 'http://api.zippopotam.us/', auth: 'none', free: true, limit: 'Unlimited', desc: 'US zip code lookup' },
    { id: 'open-library', name: 'Open Library Search', category: 'reference', url: 'https://openlibrary.org/search.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Book search via Open Library' },
    { id: 'open-library-works', name: 'Open Library Works', category: 'reference', url: 'https://openlibrary.org/works/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Book details by OLID' },
    { id: 'gutendex', name: 'Gutendex Books', category: 'reference', url: 'https://gutendex.com/books', auth: 'none', free: true, limit: 'Unlimited', desc: 'Project Gutenberg ebook catalog' },
    { id: 'isbndb', name: 'ISBNdb Book Database', category: 'reference', url: 'https://api.isbndb.com/books/', auth: 'key', keyEnv: 'ISBN_KEY', free: true, limit: '100 req/day', desc: 'Book data by ISBN' },
    { id: 'google-books', name: 'Google Books', category: 'reference', url: 'https://www.googleapis.com/books/v1/volumes', auth: 'key', keyEnv: 'GOOGLE_API_KEY', free: true, limit: '1000 req/day', desc: 'Search Google Books catalog' },
    { id: 'agify', name: 'Agify.io', category: 'reference', url: 'https://api.agify.io', auth: 'none', free: true, limit: '1000 req/day', desc: 'Predict age from name' },
    { id: 'genderize', name: 'Genderize.io', category: 'reference', url: 'https://api.genderize.io', auth: 'none', free: true, limit: '1000 req/day', desc: 'Predict gender from name' },
    { id: 'nationalize', name: 'Nationalize.io', category: 'reference', url: 'https://api.nationalize.io', auth: 'none', free: true, limit: '1000 req/day', desc: 'Predict nationality from name' },
    { id: 'whatismybrowser', name: 'UserAgent String Parser', category: 'reference', url: 'https://api.whatismybrowser.com/api/v2/user_agent_parse', auth: 'key', keyEnv: 'WIMB_KEY', free: true, limit: '100 req/day', desc: 'Parse user agent strings' },
    { id: 'barcode-lookup', name: 'Barcode Lookup', category: 'reference', url: 'https://api.barcodelookup.com/v3/products', auth: 'key', keyEnv: 'BARCODE_KEY', free: true, limit: '1000 req/day', desc: 'Barcode to product information' },
    { id: 'deutsche-bahn', name: 'Deutsche Bahn API', category: 'reference', url: 'https://v6.db-api.de/v6/', auth: 'none', free: true, limit: 'Rate limited', desc: 'German railway timetable data' },

    // ===== AI / ML APIs (40+) =====
    { id: 'hf-sentiment', name: 'HF Sentiment Analysis', category: 'ai', url: 'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Sentiment classification (positive/negative)' },
    { id: 'hf-zero-shot', name: 'HF Zero-Shot Classification', category: 'ai', url: 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Classify text without training' },
    { id: 'hf-summarization', name: 'HF Text Summarization', category: 'ai', url: 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Abstractive text summarization' },
    { id: 'hf-ner', name: 'HF Named Entity Recognition', category: 'ai', url: 'https://api-inference.huggingface.co/models/dslim/bert-base-NER', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Extract names, places, organizations' },
    { id: 'hf-question', name: 'HF Question Answering', category: 'ai', url: 'https://api-inference.huggingface.co/models/deepset/roberta-base-squad2', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Extractive QA over provided context' },
    { id: 'hf-translation-enfr', name: 'HF English-French Translation', category: 'ai', url: 'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-fr', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Translate English to French' },
    { id: 'hf-translation-deen', name: 'HF German-English Translation', category: 'ai', url: 'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-de-en', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Translate German to English' },
    { id: 'hf-translation-esen', name: 'HF Spanish-English Translation', category: 'ai', url: 'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-es-en', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Translate Spanish to English' },
    { id: 'hf-image-classify', name: 'HF Image Classification', category: 'ai', url: 'https://api-inference.huggingface.co/models/google/vit-base-patch16-224', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Classify images by content' },
    { id: 'hf-object-detect', name: 'HF Object Detection', category: 'ai', url: 'https://api-inference.huggingface.co/models/facebook/detr-resnet-50', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Detect objects in images' },
    { id: 'hf-image-seg', name: 'HF Image Segmentation', category: 'ai', url: 'https://api-inference.huggingface.co/models/facebook/detr-resnet-50-panoptic', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Panoptic image segmentation' },
    { id: 'hf-text-to-image', name: 'HF Text-to-Image', category: 'ai', url: 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Generate images from text' },
    { id: 'hf-text-to-speech', name: 'HF Text-to-Speech', category: 'ai', url: 'https://api-inference.huggingface.co/models/espnet/kan-bayashi_ljspeech_vits', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Convert text to speech audio' },
    { id: 'hf-audio-classify', name: 'HF Audio Classification', category: 'ai', url: 'https://api-inference.huggingface.co/models/superb/hubert-large-superb-er', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Classify audio content' },
    { id: 'hf-tabular', name: 'HF Tabular Regression', category: 'ai', url: 'https://api-inference.huggingface.co/models/scikit-learn/Fish-Weight', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '~300 req/hour', desc: 'Regression on tabular data' },
    { id: 'deepai-textgen', name: 'DeepAI Text Generation', category: 'ai', url: 'https://api.deepai.org/api/text-generator', auth: 'key', keyEnv: 'DEEPAI_KEY', free: true, limit: 'Rate limited', desc: 'AI text generation' },
    { id: 'deepai-sentiment', name: 'DeepAI Sentiment', category: 'ai', url: 'https://api.deepai.org/api/sentiment-analysis', auth: 'key', keyEnv: 'DEEPAI_KEY', free: true, limit: 'Rate limited', desc: 'Sentiment analysis' },
    { id: 'deepai-image', name: 'DeepAI Image Generator', category: 'ai', url: 'https://api.deepai.org/api/text2img', auth: 'key', keyEnv: 'DEEPAI_KEY', free: true, limit: 'Rate limited', desc: 'Text to image generation' },
    { id: 'deepai-nsfw', name: 'DeepAI NSFW Detection', category: 'ai', url: 'https://api.deepai.org/api/nsfw-detector', auth: 'key', keyEnv: 'DEEPAI_KEY', free: true, limit: 'Rate limited', desc: 'Detect explicit content' },
    { id: 'deepai-colorize', name: 'DeepAI Colorize Image', category: 'ai', url: 'https://api.deepai.org/api/colorizer', auth: 'key', keyEnv: 'DEEPAI_KEY', free: true, limit: 'Rate limited', desc: 'Colorize black & white photos' },
    { id: 'deepai-superres', name: 'DeepAI Super Resolution', category: 'ai', url: 'https://api.deepai.org/api/torch-srgan', auth: 'key', keyEnv: 'DEEPAI_KEY', free: true, limit: 'Rate limited', desc: 'Upscale image resolution' },
    { id: 'nudenet', name: 'NudeNet Detector', category: 'ai', url: 'https://api.nudenet.org/v1/detect', auth: 'none', free: true, limit: 'Rate limited', desc: 'Content moderation for NSFW' },
    { id: 'clarifai', name: 'Clarifai General', category: 'ai', url: 'https://api.clarifai.com/v2/models/general-image-recognition/outputs', auth: 'key', keyEnv: 'CLARIFAI_KEY', free: true, limit: '5000 req/month', desc: 'Image and video recognition' },
    { id: 'imagga', name: 'Imagga Image Tagging', category: 'ai', url: 'https://api.imagga.com/v2/tags', auth: 'key', keyEnv: 'IMAGGA_KEY', free: true, limit: '3000 req/month', desc: 'Auto-tagging and categorization' },
    { id: 'picsart', name: 'Picsart Image Editing', category: 'ai', url: 'https://api.picsart.io/v1/upscale', auth: 'key', keyEnv: 'PICSART_KEY', free: true, limit: 'Rate limited', desc: 'AI image upscaling and editing' },

    // ===== SCIENCE & SPACE APIs (30+) =====
    { id: 'nasa-astronomy', name: 'NASA APOD', category: 'science', url: 'https://api.nasa.gov/planetary/apod', auth: 'key', keyEnv: 'NASA_API_KEY', free: true, limit: '1000 req/day', desc: 'Astronomy Picture of the Day' },
    { id: 'nasa-neows', name: 'NASA Near Earth Objects', category: 'science', url: 'https://api.nasa.gov/neo/rest/v1/feed', auth: 'key', keyEnv: 'NASA_API_KEY', free: true, limit: '1000 req/day', desc: 'Asteroid tracking data' },
    { id: 'nasa-mars', name: 'NASA Mars Rover Photos', category: 'science', url: 'https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos', auth: 'key', keyEnv: 'NASA_API_KEY', free: true, limit: '1000 req/day', desc: 'Mars rover images' },
    { id: 'nasa-epic', name: 'NASA EPIC Earth', category: 'science', url: 'https://api.nasa.gov/EPIC/api/natural/images', auth: 'key', keyEnv: 'NASA_API_KEY', free: true, limit: '1000 req/day', desc: 'Earth Polychromatic Imaging Camera' },
    { id: 'nasa-insight', name: 'NASA InSight Mars', category: 'science', url: 'https://api.nasa.gov/insight_weather/', auth: 'key', keyEnv: 'NASA_API_KEY', free: true, limit: '1000 req/day', desc: 'Mars weather data from InSight' },
    { id: 'nasa-solar-flare', name: 'NASA Solar Flare', category: 'science', url: 'https://api.nasa.gov/DONKI/FLR', auth: 'key', keyEnv: 'NASA_API_KEY', free: true, limit: '1000 req/day', desc: 'Solar flare notifications' },
    { id: 'nasa-cme', name: 'NASA CME', category: 'science', url: 'https://api.nasa.gov/DONKI/CME', auth: 'key', keyEnv: 'NASA_API_KEY', free: true, limit: '1000 req/day', desc: 'Coronal Mass Ejection data' },
    { id: 'nasa-techport', name: 'NASA TechPort', category: 'science', url: 'https://api.nasa.gov/techport/api/projects', auth: 'key', keyEnv: 'NASA_API_KEY', free: true, limit: '1000 req/day', desc: 'NASA technology projects' },
    { id: 'usgs-earthquakes', name: 'USGS Earthquakes', category: 'science', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson', auth: 'none', free: true, limit: 'Unlimited', desc: 'Real-time earthquake data' },
    { id: 'usgs-significant', name: 'USGS Significant Quakes', category: 'science', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson', auth: 'none', free: true, limit: 'Unlimited', desc: 'Significant earthquakes past month' },
    { id: 'noaa-space', name: 'NOAA Space Weather', category: 'science', url: 'https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Solar flares, K-index, aurora' },
    { id: 'noaa-sst', name: 'NOAA Sea Surface Temp', category: 'science', url: 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Sea surface temperature data' },
    { id: 'open-notify', name: 'Open Notify ISS', category: 'science', url: 'http://api.open-notify.org/iss-now.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Current ISS location' },
    { id: 'open-notify-people', name: 'Open Notify Space People', category: 'science', url: 'http://api.open-notify.org/astros.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'People currently in space' },
    { id: 'celestrak', name: 'CelesTrak Satellite Catalog', category: 'science', url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle', auth: 'none', free: true, limit: 'Rate limited', desc: 'Active satellite TLE data' },
    { id: 'celestrak-stations', name: 'CelesTrak Space Stations', category: 'science', url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle', auth: 'none', free: true, limit: 'Rate limited', desc: 'Space station orbital data' },
    { id: 'jpl-horizons', name: 'JPL Horizons', category: 'science', url: 'https://ssd.jpl.nasa.gov/api/horizons.api', auth: 'none', free: true, limit: 'Rate limited', desc: 'Solar system ephemeris data' },
    { id: 'launch-library', name: 'Launch Library 2', category: 'science', url: 'https://ll.thespacedevs.com/2.2.0/launch/upcoming', auth: 'none', free: true, limit: 'Rate limited', desc: 'Upcoming rocket launches' },
    { id: 'covid-track', name: 'COVID-19 Tracking', category: 'science', url: 'https://disease.sh/v3/covid-19/all', auth: 'none', free: true, limit: 'Unlimited', desc: 'Global COVID-19 statistics' },
    { id: 'covid-countries', name: 'COVID-19 by Country', category: 'science', url: 'https://disease.sh/v3/covid-19/countries', auth: 'none', free: true, limit: 'Unlimited', desc: 'COVID-19 data per country' },
    { id: 'pubmed', name: 'PubMed E-utilities', category: 'science', url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', auth: 'none', free: true, limit: '10 req/sec', desc: 'PubMed biomedical article summaries' },
    { id: 'pubmed-search', name: 'PubMed Search', category: 'science', url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', auth: 'none', free: true, limit: '10 req/sec', desc: 'PubMed article search' },
    { id: 'open-access', name: 'Open Access Button', category: 'science', url: 'https://api.openaccessbutton.org/search', auth: 'none', free: true, limit: 'Rate limited', desc: 'Find open access research' },
    { id: 'arxiv', name: 'arXiv Search', category: 'science', url: 'http://export.arxiv.org/api/query', auth: 'none', free: true, limit: '1 req/3 sec', desc: 'arXiv paper search and metadata' },
    { id: 'semantic-scholar', name: 'Semantic Scholar', category: 'science', url: 'https://api.semanticscholar.org/graph/v1/paper/search', auth: 'none', free: true, limit: '100 req/min', desc: 'Academic paper search and citation data' },
    { id: 'open-alex', name: 'OpenAlex', category: 'science', url: 'https://api.openalex.org/works', auth: 'none', free: true, limit: '100 req/sec', desc: 'Open scientific works database' },

    // ===== GEOGRAPHY & MAPS APIs (25+) =====
    { id: 'nominatim', name: 'OpenStreetMap Nominatim', category: 'geography', url: 'https://nominatim.openstreetmap.org/search', auth: 'none', free: true, limit: '1 req/sec', desc: 'Geocoding: address to coordinates' },
    { id: 'nominatim-reverse', name: 'OpenStreetMap Reverse Geocode', category: 'geography', url: 'https://nominatim.openstreetmap.org/reverse', auth: 'none', free: true, limit: '1 req/sec', desc: 'Coordinates to address' },
    { id: 'osm-overpass', name: 'OSM Overpass API', category: 'geography', url: 'https://overpass-api.de/api/interpreter', auth: 'none', free: true, limit: 'Rate limited', desc: 'OpenStreetMap query language' },
    { id: 'openrouteservice', name: 'OpenRouteService', category: 'geography', url: 'https://api.openrouteservice.org/v2/directions/driving-car', auth: 'key', keyEnv: 'ORS_KEY', free: true, limit: '2000 req/day', desc: 'Routing and directions' },
    { id: 'openrouteservice-isochrone', name: 'ORS Isochrones', category: 'geography', url: 'https://api.openrouteservice.org/v2/isochrones/driving-car', auth: 'key', keyEnv: 'ORS_KEY', free: true, limit: '2000 req/day', desc: 'Travel time polygons' },
    { id: 'openrouteservice-matrix', name: 'ORS Matrix', category: 'geography', url: 'https://api.openrouteservice.org/v2/matrix/driving-car', auth: 'key', keyEnv: 'ORS_KEY', free: true, limit: '2000 req/day', desc: 'Distance matrix computation' },
    { id: 'photon', name: 'Photon Geocoder', category: 'geography', url: 'https://photon.komoot.io/api', auth: 'none', free: true, limit: 'Unlimited', desc: 'OpenStreetMap geocoding' },
    { id: 'photon-reverse', name: 'Photon Reverse Geocode', category: 'geography', url: 'https://photon.komoot.io/reverse', auth: 'none', free: true, limit: 'Unlimited', desc: 'Reverse geocoding via Photon' },
    { id: 'geoapify', name: 'Geoapify Geocoding', category: 'geography', url: 'https://api.geoapify.com/v1/geocode/search', auth: 'key', keyEnv: 'GEOAPIFY_KEY', free: true, limit: '3000 req/day', desc: 'Forward and reverse geocoding' },
    { id: 'mapbox', name: 'Mapbox Geocoding', category: 'geography', url: 'https://api.mapbox.com/geocoding/v5/mapbox.places/', auth: 'key', keyEnv: 'MAPBOX_KEY', free: true, limit: '100000 req/month', desc: 'Geocoding and maps' },
    { id: 'here-geo', name: 'HERE Geocoding', category: 'geography', url: 'https://geocode.search.hereapi.com/v1/geocode', auth: 'key', keyEnv: 'HERE_KEY', free: true, limit: '250000 req/month', desc: 'HERE maps geocoding' },
    { id: 'timezonedb', name: 'TimeZoneDB', category: 'geography', url: 'https://api.timezonedb.com/v2.1/get-time-zone', auth: 'key', keyEnv: 'TIMEZONEDB_KEY', free: true, limit: '1000 req/day', desc: 'Time zone lookup by coordinates' },
    { id: 'worldtime', name: 'WorldTimeAPI', category: 'geography', url: 'https://worldtimeapi.org/api/timezone', auth: 'none', free: true, limit: 'Unlimited', desc: 'Current time by timezone' },
    { id: 'worldtime-ip', name: 'WorldTimeAPI by IP', category: 'geography', url: 'http://worldtimeapi.org/api/ip', auth: 'none', free: true, limit: 'Unlimited', desc: 'Current time based on IP' },
    { id: 'open-topo', name: 'Open Topo Data', category: 'geography', url: 'https://api.opentopodata.org/v1/aster30m', auth: 'none', free: true, limit: '1000 req/day', desc: 'Elevation data by coordinates' },
    { id: 'usgs-elevation', name: 'USGS Elevation', category: 'geography', url: 'https://epqs.nationalmap.gov/v1/json', auth: 'none', free: true, limit: 'Unlimited', desc: 'US elevation point query' },
    { id: 'tides', name: 'World Tides', category: 'geography', url: 'https://www.worldtides.info/api/v2', auth: 'key', keyEnv: 'TIDES_KEY', free: true, limit: '200 req/day', desc: 'Tide predictions worldwide' },
    { id: 'stormglass', name: 'StormGlass Marine', category: 'geography', url: 'https://api.stormglass.io/v2/weather/point', auth: 'key', keyEnv: 'STORMGLASS_KEY', free: true, limit: '50 req/day', desc: 'Marine weather and tide data' },

    // ===== IMAGES & ART APIs (20+) =====
    { id: 'dicebear', name: 'DiceBear Avatars', category: 'images', url: 'https://api.dicebear.com/7.x/pixel-art/svg', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random SVG avatar generation' },
    { id: 'dicebear-identicon', name: 'DiceBear Identicon', category: 'images', url: 'https://api.dicebear.com/7.x/identicon/svg', auth: 'none', free: true, limit: 'Unlimited', desc: 'Identicon style avatar' },
    { id: 'dicebear-bottts', name: 'DiceBear Bottts', category: 'images', url: 'https://api.dicebear.com/7.x/bottts/svg', auth: 'none', free: true, limit: 'Unlimited', desc: 'Robot avatar style' },
    { id: 'dog-api', name: 'Dog CEO', category: 'images', url: 'https://dog.ceo/api/breeds/image/random', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random dog images' },
    { id: 'cat-api', name: 'The Cat API', category: 'images', url: 'https://api.thecatapi.com/v1/images/search', auth: 'key', keyEnv: 'CATAPI_KEY', free: true, limit: '100 req/day', desc: 'Random cat images' },
    { id: 'fox-api', name: 'RandomFox', category: 'images', url: 'https://randomfox.ca/floof/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random fox images' },
    { id: 'shibe', name: 'Shibe.online', category: 'images', url: 'https://shibe.online/api/shibes', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random shiba inu images' },
    { id: 'placekitten', name: 'PlaceKitten', category: 'images', url: 'https://placekitten.com/g/400/300', auth: 'none', free: true, limit: 'Unlimited', desc: 'Kitten placeholder images' },
    { id: 'picsum', name: 'Picsum Photos', category: 'images', url: 'https://picsum.photos/400/300', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random placeholder photos' },
    { id: 'unsplash', name: 'Unsplash Photos', category: 'images', url: 'https://api.unsplash.com/photos/random', auth: 'key', keyEnv: 'UNSPLASH_KEY', free: true, limit: '50 req/hour', desc: 'High quality stock photos' },
    { id: 'pexels', name: 'Pexels Photos', category: 'images', url: 'https://api.pexels.com/v1/search', auth: 'key', keyEnv: 'PEXELS_KEY', free: true, limit: '200 req/hour', desc: 'Stock photos and videos' },
    { id: 'pixabay', name: 'Pixabay Images', category: 'images', url: 'https://pixabay.com/api/', auth: 'key', keyEnv: 'PIXABAY_KEY', free: true, limit: '5000 req/day', desc: 'Free stock images and videos' },
    { id: 'flickr', name: 'Flickr Recent', category: 'images', url: 'https://www.flickr.com/services/rest/', auth: 'key', keyEnv: 'FLICKR_KEY', free: true, limit: '3600 req/hour', desc: 'Flickr photo search and metadata' },
    { id: 'art-institute', name: 'Art Institute of Chicago', category: 'images', url: 'https://api.artic.edu/api/v1/artworks/search', auth: 'none', free: true, limit: 'Unlimited', desc: 'Museum artwork catalog' },
    { id: 'met-museum', name: 'Metropolitan Museum', category: 'images', url: 'https://collectionapi.metmuseum.org/public/collection/v1/search', auth: 'none', free: true, limit: '80 req/sec', desc: 'Met Museum collection search' },
    { id: 'rijksmuseum', name: 'Rijksmuseum', category: 'images', url: 'https://www.rijksmuseum.nl/api/en/collection', auth: 'key', keyEnv: 'RIJKSMUSEUM_KEY', free: true, limit: 'Unlimited', desc: 'Dutch national museum collection' },
    { id: 'colourlovers', name: 'COLOURlovers', category: 'images', url: 'https://www.colourlovers.com/api/colors/new?format=json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Color trends and palettes' },
    { id: 'qrcode', name: 'QR Code Generator', category: 'images', url: 'https://api.qrserver.com/v1/create-qr-code/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Generate QR codes' },
    { id: 'imgur', name: 'Imgur Gallery', category: 'images', url: 'https://api.imgur.com/3/gallery/hot/viral/0.json', auth: 'key', keyEnv: 'IMGUR_KEY', free: true, limit: '12500 req/day', desc: 'Imgur image gallery' },
    { id: 'gravatar', name: 'Gravatar Profile', category: 'images', url: 'https://www.gravatar.com/avatar/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Gravatar user avatars by hash' },

    // ===== MUSIC & AUDIO APIs (20+) =====
    { id: 'spotify-search', name: 'Spotify Search', category: 'music', url: 'https://api.spotify.com/v1/search', auth: 'key', keyEnv: 'SPOTIFY_KEY', free: true, limit: 'Rate limited', desc: 'Search Spotify tracks, albums, artists' },
    { id: 'lastfm', name: 'Last.fm Top Tracks', category: 'music', url: 'https://ws.audioscrobbler.com/2.0/', auth: 'key', keyEnv: 'LASTFM_KEY', free: true, limit: 'Unlimited', desc: 'Music metadata and charts' },
    { id: 'musixmatch', name: 'Musixmatch Lyrics', category: 'music', url: 'https://api.musixmatch.com/ws/1.1/track.search', auth: 'key', keyEnv: 'MUSIXMATCH_KEY', free: true, limit: '2000 req/day', desc: 'Song lyrics search' },
    { id: 'discogs', name: 'Discogs Search', category: 'music', url: 'https://api.discogs.com/database/search', auth: 'key', keyEnv: 'DISCOGS_KEY', free: true, limit: '25 req/min', desc: 'Music discography database' },
    { id: 'musicbrainz', name: 'MusicBrainz', category: 'music', url: 'https://musicbrainz.org/ws/2/artist/', auth: 'none', free: true, limit: '50 req/sec', desc: 'Music metadata database' },
    { id: 'acousticbrainz', name: 'AcousticBrainz', category: 'music', url: 'https://acousticbrainz.org/api/v1/recording/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Music acoustic characteristics' },
    { id: 'deezer', name: 'Deezer Search', category: 'music', url: 'https://api.deezer.com/search/track', auth: 'none', free: true, limit: 'Rate limited', desc: 'Deezer music catalog search' },
    { id: 'shazam', name: 'Shazam Core', category: 'music', url: 'https://shazam.p.rapidapi.com/search', auth: 'key', keyEnv: 'RAPIDAPI_KEY', free: true, limit: '500 req/month', desc: 'Shazam song recognition' },
    { id: 'audiodb', name: 'TheAudioDB', category: 'music', url: 'https://www.theaudiodb.com/api/v1/json/2/track.php', auth: 'none', free: true, limit: 'Unlimited', desc: 'Music database with album art' },
    { id: 'songkick', name: 'Songkick Events', category: 'music', url: 'https://api.songkick.com/api/3.0/events.json', auth: 'key', keyEnv: 'SONGKICK_KEY', free: true, limit: 'Unlimited', desc: 'Live concert events' },
    { id: 'genius', name: 'Genius Song Lyrics', category: 'music', url: 'https://api.genius.com/search', auth: 'key', keyEnv: 'GENIUS_KEY', free: true, limit: 'Rate limited', desc: 'Song lyrics and annotations' },
    { id: 'jamendo', name: 'Jamendo Music', category: 'music', url: 'https://api.jamendo.com/v3.0/tracks/', auth: 'key', keyEnv: 'JAMENDO_KEY', free: true, limit: 'Unlimited', desc: 'Free music streaming catalog' },
    { id: 'freesound', name: 'Freesound', category: 'music', url: 'https://freesound.org/apiv2/search/text/', auth: 'key', keyEnv: 'FREESOUND_KEY', free: true, limit: 'Rate limited', desc: 'Collaborative sound database' },

    // ===== VIDEO & STREAMING APIs (15+) =====
    { id: 'youtube-search', name: 'YouTube Search', category: 'video', url: 'https://www.googleapis.com/youtube/v3/search', auth: 'key', keyEnv: 'YOUTUBE_KEY', free: true, limit: '10000 req/day', desc: 'YouTube video search' },
    { id: 'youtube-video', name: 'YouTube Video Details', category: 'video', url: 'https://www.googleapis.com/youtube/v3/videos', auth: 'key', keyEnv: 'YOUTUBE_KEY', free: true, limit: '10000 req/day', desc: 'YouTube video metadata' },
    { id: 'youtube-trending', name: 'YouTube Trending', category: 'video', url: 'https://www.googleapis.com/youtube/v3/videos', auth: 'key', keyEnv: 'YOUTUBE_KEY', free: true, limit: '10000 req/day', desc: 'Trending YouTube videos' },
    { id: 'tmdb', name: 'TMDB Movie Database', category: 'video', url: 'https://api.themoviedb.org/3/search/movie', auth: 'key', keyEnv: 'TMDB_KEY', free: true, limit: '50 req/sec', desc: 'Movie and TV show data' },
    { id: 'tmdb-popular', name: 'TMDB Popular Movies', category: 'video', url: 'https://api.themoviedb.org/3/movie/popular', auth: 'key', keyEnv: 'TMDB_KEY', free: true, limit: '50 req/sec', desc: 'Popular movie listings' },
    { id: 'omdb', name: 'OMDB Movie Details', category: 'video', url: 'https://www.omdbapi.com/', auth: 'key', keyEnv: 'OMDB_KEY', free: true, limit: '1000 req/day', desc: 'Movie metadata and ratings' },
    { id: 'tvdb', name: 'TVDB Show Data', category: 'video', url: 'https://api4.thetvdb.com/v4/search', auth: 'key', keyEnv: 'TVDB_KEY', free: true, limit: 'Rate limited', desc: 'TV show episode metadata' },
    { id: 'ott-details', name: 'OTT Details', category: 'video', url: 'https://ott-details.p.rapidapi.com/search', auth: 'key', keyEnv: 'RAPIDAPI_KEY', free: true, limit: 'Rate limited', desc: 'Streaming platform availability' },
    { id: 'streaming-availability', name: 'Streaming Availability', category: 'video', url: 'https://streaming-availability.p.rapidapi.com/search/basic', auth: 'key', keyEnv: 'RAPIDAPI_KEY', free: true, limit: 'Rate limited', desc: 'What streams where' },
    { id: 'trakt', name: 'Trakt.tv', category: 'video', url: 'https://api.trakt.tv/movies/popular', auth: 'key', keyEnv: 'TRAKT_KEY', free: true, limit: '1000 req/5min', desc: 'TV and movie tracking' },
    { id: 'anilist', name: 'AniList Anime', category: 'video', url: 'https://graphql.anilist.co', auth: 'none', free: true, limit: '90 req/min', desc: 'Anime and manga database GraphQL' },
    { id: 'jikan', name: 'Jikan MyAnimeList', category: 'video', url: 'https://api.jikan.moe/v4/anime', auth: 'none', free: true, limit: '60 req/min', desc: 'MyAnimeList unofficial API' },
    { id: 'kitsu', name: 'Kitsu Anime', category: 'video', url: 'https://kitsu.io/api/edge/anime', auth: 'none', free: true, limit: 'Rate limited', desc: 'Anime discovery platform' },

    // ===== GAMES & COMICS APIs (25+) =====
    { id: 'pokemon', name: 'PokéAPI', category: 'games', url: 'https://pokeapi.co/api/v2/pokemon/', auth: 'none', free: true, limit: '300 req/min', desc: 'Complete Pokémon data' },
    { id: 'pokemon-species', name: 'PokéAPI Species', category: 'games', url: 'https://pokeapi.co/api/v2/pokemon-species/', auth: 'none', free: true, limit: '300 req/min', desc: 'Pokémon species details' },
    { id: 'pokemon-type', name: 'PokéAPI Types', category: 'games', url: 'https://pokeapi.co/api/v2/type/', auth: 'none', free: true, limit: '300 req/min', desc: 'Pokémon type matchups' },
    { id: 'pokemon-ability', name: 'PokéAPI Abilities', category: 'games', url: 'https://pokeapi.co/api/v2/ability/', auth: 'none', free: true, limit: '300 req/min', desc: 'Pokémon ability details' },
    { id: 'pokemon-game', name: 'PokéAPI Games', category: 'games', url: 'https://pokeapi.co/api/v2/version-group/', auth: 'none', free: true, limit: '300 req/min', desc: 'Pokémon game version groups' },
    { id: 'mc-status', name: 'Minecraft Server Status', category: 'games', url: 'https://api.mcsrvstat.us/2/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Minecraft server info and status' },
    { id: 'mc-motd', name: 'Minecraft MOTD', category: 'games', url: 'https://api.minetools.eu/ping/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Minecraft server ping' },
    { id: 'mc-uuid', name: 'Minecraft UUID', category: 'games', url: 'https://api.mojang.com/users/profiles/minecraft/', auth: 'none', free: true, limit: '600 req/10min', desc: 'Minecraft username to UUID' },
    { id: 'mc-profile', name: 'Minecraft Profile', category: 'games', url: 'https://sessionserver.mojang.com/session/minecraft/profile/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Minecraft player profile' },
    { id: 'chess', name: 'Chess.com API', category: 'games', url: 'https://api.chess.com/pub/player/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Chess.com player stats and games' },
    { id: 'chess-puzzles', name: 'Chess.com Puzzles', category: 'games', url: 'https://api.chess.com/pub/puzzles', auth: 'none', free: true, limit: 'Rate limited', desc: 'Daily chess puzzles' },
    { id: 'lichess', name: 'Lichess API', category: 'games', url: 'https://lichess.org/api/user/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Lichess player data and games' },
    { id: 'dnd5e', name: 'D&D 5e API', category: 'games', url: 'https://www.dnd5eapi.co/api/monsters', auth: 'none', free: true, limit: 'Unlimited', desc: 'Dungeons & Dragons 5th edition data' },
    { id: 'dnd5e-spells', name: 'D&D 5e Spells', category: 'games', url: 'https://www.dnd5eapi.co/api/spells', auth: 'none', free: true, limit: 'Unlimited', desc: 'D&D 5e spell database' },
    { id: 'dnd5e-classes', name: 'D&D 5e Classes', category: 'games', url: 'https://www.dnd5eapi.co/api/classes', auth: 'none', free: true, limit: 'Unlimited', desc: 'D&D 5e character classes' },
    { id: 'ffxiv', name: 'FFXIV XIVAPI', category: 'games', url: 'https://xivapi.com/character/search', auth: 'none', free: true, limit: 'Rate limited', desc: 'Final Fantasy XIV character data' },
    { id: 'osrs', name: 'Old School RuneScape', category: 'games', url: 'https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws', auth: 'none', free: true, limit: 'Rate limited', desc: 'OSRS hiscore data' },
    { id: 'rs3', name: 'RuneScape 3', category: 'games', url: 'https://secure.runescape.com/m=hiscore/index_lite.ws', auth: 'none', free: true, limit: 'Rate limited', desc: 'RS3 hiscore data' },
    { id: 'valorant', name: 'Valorant API', category: 'games', url: 'https://valorant-api.com/v1/agents', auth: 'none', free: true, limit: 'Unlimited', desc: 'Valorant game data' },
    { id: 'valorant-weapons', name: 'Valorant Weapons', category: 'games', url: 'https://valorant-api.com/v1/weapons', auth: 'none', free: true, limit: 'Unlimited', desc: 'Valorant weapon stats' },
    { id: 'brawl-stars', name: 'Brawl Stars API', category: 'games', url: 'https://api.brawlstars.com/v1/brawlers', auth: 'key', keyEnv: 'BRAWL_KEY', free: true, limit: '200 req/min', desc: 'Brawl Stars game data' },
    { id: 'clash-royale', name: 'Clash Royale API', category: 'games', url: 'https://api.clashroyale.com/v1/cards', auth: 'key', keyEnv: 'CLASH_KEY', free: true, limit: 'Rate limited', desc: 'Clash Royale game data' },
    { id: 'clan-ratings', name: 'Clan Ratings', category: 'games', url: 'https://api.clanratings.com/v1/clans', auth: 'none', free: true, limit: 'Rate limited', desc: 'Gaming clan ratings' },
    { id: 'speedrun', name: 'Speedrun.com', category: 'games', url: 'https://www.speedrun.com/api/v1/games', auth: 'none', free: true, limit: 'Rate limited', desc: 'Speedrun data and leaderboards' },
    { id: 'giantbomb', name: 'Giant Bomb', category: 'games', url: 'https://www.giantbomb.com/api/search/', auth: 'key', keyEnv: 'GIANTBOMB_KEY', free: true, limit: 'Rate limited', desc: 'Video game database' },
    { id: 'opentdb', name: 'Open Trivia DB', category: 'games', url: 'https://opentdb.com/api.php', auth: 'none', free: true, limit: 'Unlimited', desc: 'Trivia questions and answers' },
    { id: 'marvel', name: 'Marvel Comics', category: 'games', url: 'https://gateway.marvel.com/v1/public/characters', auth: 'key', keyEnv: 'MARVEL_KEY', free: true, limit: '3000 req/day', desc: 'Marvel comic characters and comics' },
    { id: 'xkcd', name: 'xkcd Comic', category: 'games', url: 'https://xkcd.com/info.0.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Latest xkcd comic data' },
    { id: 'xkcd-specific', name: 'xkcd Specific', category: 'games', url: 'https://xkcd.com/{id}/info.0.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Specific xkcd comic by number' },

    // ===== SOCIAL MEDIA APIs (15+) =====
    { id: 'reddit-user', name: 'Reddit User Info', category: 'social', url: 'https://www.reddit.com/user/{user}/about.json', auth: 'none', free: true, limit: '60 req/min', desc: 'Reddit user profile data' },
    { id: 'reddit-subreddit', name: 'Reddit Subreddit Info', category: 'social', url: 'https://www.reddit.com/r/{sub}/about.json', auth: 'none', free: true, limit: '60 req/min', desc: 'Subreddit information' },
    { id: 'reddit-top', name: 'Reddit Top Posts', category: 'social', url: 'https://www.reddit.com/top.json', auth: 'none', free: true, limit: '60 req/min', desc: 'Reddit top posts' },
    { id: 'twitter-trends', name: 'Twitter Trends (nitter)', category: 'social', url: 'https://nitter.net/trends.json', auth: 'none', free: true, limit: 'Rate limited', desc: 'Twitter trending topics (via Nitter)' },
    { id: 'mastodon-public', name: 'Mastodon Public Timeline', category: 'social', url: 'https://mastodon.social/api/v1/timelines/public', auth: 'none', free: true, limit: '300 req/5min', desc: 'Mastodon public feed' },
    { id: 'mastodon-search', name: 'Mastodon Search', category: 'social', url: 'https://mastodon.social/api/v2/search', auth: 'none', free: true, limit: '300 req/5min', desc: 'Search Mastodon content' },
    { id: 'bluesky', name: 'Bluesky Social', category: 'social', url: 'https://public.api.bsky.app/xrpc/app.bsky.feed.getTimeline', auth: 'none', free: true, limit: 'Rate limited', desc: 'Bluesky social feed' },
    { id: 'gravatar-profile', name: 'Gravatar Profile Lookup', category: 'social', url: 'https://api.gravatar.com/v3/profiles/{hash}', auth: 'none', free: true, limit: 'Rate limited', desc: 'Gravatar user profiles' },
    { id: 'telegram', name: 'Telegram Bot API', category: 'social', url: 'https://api.telegram.org/bot{token}/getMe', auth: 'key', keyEnv: 'TELEGRAM_BOT_TOKEN', free: true, limit: '30 req/sec', desc: 'Telegram bot operations' },
    { id: 'discord', name: 'Discord Bot API', category: 'social', url: 'https://discord.com/api/v10/users/@me', auth: 'key', keyEnv: 'DISCORD_TOKEN', free: true, limit: 'Rate limited', desc: 'Discord bot operations' },
    { id: 'slack', name: 'Slack API', category: 'social', url: 'https://slack.com/api/conversations.list', auth: 'key', keyEnv: 'SLACK_TOKEN', free: true, limit: 'Rate limited', desc: 'Slack workspace operations' },
    { id: 'matrix', name: 'Matrix Client', category: 'social', url: 'https://matrix-client.matrix.org/_matrix/client/v3/rooms', auth: 'key', keyEnv: 'MATRIX_TOKEN', free: true, limit: 'Rate limited', desc: 'Matrix messaging protocol' },
    { id: 'linkedin', name: 'LinkedIn Profile', category: 'social', url: 'https://api.linkedin.com/v2/userinfo', auth: 'key', keyEnv: 'LINKEDIN_KEY', free: true, limit: 'Rate limited', desc: 'LinkedIn profile data' },
    { id: 'tumblr', name: 'Tumblr Posts', category: 'social', url: 'https://api.tumblr.com/v2/blog/{blog}/posts', auth: 'key', keyEnv: 'TUMBLR_KEY', free: true, limit: 'Rate limited', desc: 'Tumblr blog posts' },
    { id: 'devto', name: 'DEV.to Articles', category: 'social', url: 'https://dev.to/api/articles', auth: 'none', free: true, limit: 'Unlimited', desc: 'DEV community articles' },
    { id: 'medium', name: 'Medium Posts', category: 'social', url: 'https://api.medium.com/v1/me/publications', auth: 'key', keyEnv: 'MEDIUM_KEY', free: true, limit: 'Rate limited', desc: 'Medium publication data' },

    // ===== DEVELOPMENT & TOOLS APIs (40+) =====
    { id: 'github-user', name: 'GitHub User', category: 'development', url: 'https://api.github.com/users/', auth: 'none', free: true, limit: '60 req/hour', desc: 'GitHub user profile' },
    { id: 'github-repo', name: 'GitHub Repo', category: 'development', url: 'https://api.github.com/repos/', auth: 'none', free: true, limit: '60 req/hour', desc: 'GitHub repository data' },
    { id: 'github-search', name: 'GitHub Search Code', category: 'development', url: 'https://api.github.com/search/code', auth: 'key', keyEnv: 'GITHUB_TOKEN', free: true, limit: '30 req/min', desc: 'Search GitHub code' },
    { id: 'github-trending', name: 'GitHub Trending', category: 'development', url: 'https://api.github.com/search/repositories', auth: 'key', keyEnv: 'GITHUB_TOKEN', free: true, limit: '30 req/min', desc: 'Trending repos' },
    { id: 'github-commits', name: 'GitHub Commits', category: 'development', url: 'https://api.github.com/repos/{owner}/{repo}/commits', auth: 'none', free: true, limit: '60 req/hour', desc: 'Repository commit history' },
    { id: 'github-issues', name: 'GitHub Issues', category: 'development', url: 'https://api.github.com/search/issues', auth: 'key', keyEnv: 'GITHUB_TOKEN', free: true, limit: '30 req/min', desc: 'Search GitHub issues' },
    { id: 'gitlab', name: 'GitLab Projects', category: 'development', url: 'https://gitlab.com/api/v4/projects', auth: 'key', keyEnv: 'GITLAB_TOKEN', free: true, limit: '2000 req/min', desc: 'GitLab project data' },
    { id: 'gitlab-public', name: 'GitLab Public Projects', category: 'development', url: 'https://gitlab.com/api/v4/projects/public', auth: 'none', free: true, limit: 'Rate limited', desc: 'Public GitLab projects' },
    { id: 'bitbucket', name: 'Bitbucket Repos', category: 'development', url: 'https://api.bitbucket.org/2.0/repositories', auth: 'key', keyEnv: 'BITBUCKET_KEY', free: true, limit: '1000 req/hour', desc: 'Bitbucket repository data' },
    { id: 'npm', name: 'npm Registry', category: 'development', url: 'https://registry.npmjs.org/', auth: 'none', free: true, limit: 'Rate limited', desc: 'npm package metadata' },
    { id: 'npm-search', name: 'npm Search', category: 'development', url: 'https://registry.npmjs.org/-/v1/search', auth: 'none', free: true, limit: 'Rate limited', desc: 'Search npm packages' },
    { id: 'pypi', name: 'PyPI Project', category: 'development', url: 'https://pypi.org/pypi/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Python package index data' },
    { id: 'rubygems', name: 'RubyGems', category: 'development', url: 'https://rubygems.org/api/v1/gems/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Ruby gem metadata' },
    { id: 'crates', name: 'crates.io', category: 'development', url: 'https://crates.io/api/v1/crates', auth: 'none', free: true, limit: 'Rate limited', desc: 'Rust crate registry' },
    { id: 'nuget', name: 'NuGet Packages', category: 'development', url: 'https://api.nuget.org/v3/catalog0/index.json', auth: 'none', free: true, limit: 'Rate limited', desc: '.NET package registry' },
    { id: 'docker', name: 'Docker Hub', category: 'development', url: 'https://hub.docker.com/v2/repositories/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Docker image registry' },
    { id: 'docker-search', name: 'Docker Hub Search', category: 'development', url: 'https://hub.docker.com/v2/repositories/library/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Search Docker images' },
    { id: 'cdnjs', name: 'cdnjs Libraries', category: 'development', url: 'https://api.cdnjs.com/libraries', auth: 'none', free: true, limit: 'Unlimited', desc: 'JavaScript library CDN' },
    { id: 'jsdelivr', name: 'jsDelivr CDN', category: 'development', url: 'https://data.jsdelivr.com/v1/packages/npm/', auth: 'none', free: true, limit: 'Unlimited', desc: 'CDN package stats' },
    { id: 'unpkg', name: 'unpkg CDN', category: 'development', url: 'https://unpkg.com/', auth: 'none', free: true, limit: 'Unlimited', desc: 'CDN for npm packages' },
    { id: 'skypack', name: 'Skypack CDN', category: 'development', url: 'https://cdn.skypack.dev/', auth: 'none', free: true, limit: 'Unlimited', desc: 'ESM CDN for npm packages' },
    { id: 'httpbin', name: 'HTTPBin', category: 'development', url: 'https://httpbin.org/get', auth: 'none', free: true, limit: 'Unlimited', desc: 'HTTP request/response testing' },
    { id: 'httpcat', name: 'HTTP Cats', category: 'development', url: 'https://http.cat/', auth: 'none', free: true, limit: 'Unlimited', desc: 'HTTP status code cat images' },
    { id: 'dogbin', name: 'Dogbin Pastes', category: 'development', url: 'https://del.dog/documents', auth: 'none', free: true, limit: 'Unlimited', desc: 'Pastebin service' },
    { id: 'hastebin', name: 'Hastebin', category: 'development', url: 'https://hastebin.skyra.pw/documents', auth: 'none', free: true, limit: 'Unlimited', desc: 'Code snippet sharing' },
    { id: 'codeforces', name: 'Codeforces', category: 'development', url: 'https://codeforces.com/api/problemset.problems', auth: 'none', free: true, limit: 'Rate limited', desc: 'Competitive programming problems' },
    { id: 'leetcode', name: 'LeetCode GraphQL', category: 'development', url: 'https://leetcode.com/graphql', auth: 'none', free: true, limit: 'Rate limited', desc: 'LeetCode problems and user data' },
    { id: 'openai-compat', name: 'OpenAI Compatible Serve', category: 'development', url: 'https://api.openai.com/v1/models', auth: 'key', keyEnv: 'OPENAI_KEY', free: false, limit: 'Paid tier', desc: 'OpenAI-compatible API endpoint' },
    { id: 'sonarqube', name: 'SonarQube', category: 'development', url: 'https://sonarcloud.io/api/measures/component', auth: 'key', keyEnv: 'SONAR_KEY', free: true, limit: 'Rate limited', desc: 'Code quality metrics' },
    { id: 'snyk', name: 'Snyk Vulnerabilities', category: 'development', url: 'https://snyk.io/api/v1/test/npm/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Package vulnerability checks' },

    // ===== SECURITY APIs (15+) =====
    { id: 'shodan', name: 'Shodan Host', category: 'security', url: 'https://api.shodan.io/shodan/host/', auth: 'key', keyEnv: 'SHODAN_KEY', free: true, limit: '50 req/sec', desc: 'Internet-connected device search' },
    { id: 'shodan-dns', name: 'Shodan DNS Resolve', category: 'security', url: 'https://api.shodan.io/dns/resolve', auth: 'key', keyEnv: 'SHODAN_KEY', free: true, limit: 'Rate limited', desc: 'DNS resolution via Shodan' },
    { id: 'virustotal', name: 'VirusTotal URL Scan', category: 'security', url: 'https://www.virustotal.com/api/v3/urls', auth: 'key', keyEnv: 'VT_KEY', free: true, limit: '500 req/day', desc: 'URL threat analysis' },
    { id: 'virustotal-domain', name: 'VirusTotal Domain', category: 'security', url: 'https://www.virustotal.com/api/v3/domains/', auth: 'key', keyEnv: 'VT_KEY', free: true, limit: '500 req/day', desc: 'Domain reputation analysis' },
    { id: 'abuseipdb', name: 'AbuseIPDB', category: 'security', url: 'https://api.abuseipdb.com/api/v2/check', auth: 'key', keyEnv: 'ABUSEIPDB_KEY', free: true, limit: '1000 req/day', desc: 'IP address reputation check' },
    { id: 'alienvault', name: 'AlienVault OTX', category: 'security', url: 'https://otx.alienvault.com/api/v1/indicators/ip/', auth: 'key', keyEnv: 'OTX_KEY', free: true, limit: 'Rate limited', desc: 'Threat intelligence indicators' },
    { id: 'cvedetails', name: 'CVE Details', category: 'security', url: 'https://www.cvedetails.com/api/v1/vulnerability', auth: 'none', free: true, limit: 'Rate limited', desc: 'CVE vulnerability database' },
    { id: 'nvd', name: 'National Vulnerability DB', category: 'security', url: 'https://services.nvd.nist.gov/rest/json/cves/2.0', auth: 'none', free: true, limit: 'Rate limited', desc: 'US NVD CVE data' },
    { id: 'haveibeenpwned', name: 'Have I Been Pwned', category: 'security', url: 'https://haveibeenpwned.com/api/v3/breachedaccount/', auth: 'key', keyEnv: 'HIBP_KEY', free: true, limit: 'Rate limited', desc: 'Check breached accounts' },
    { id: 'haveibeenpwned-all', name: 'HIBP All Breaches', category: 'security', url: 'https://haveibeenpwned.com/api/v3/breaches', auth: 'none', free: true, limit: 'Rate limited', desc: 'All known data breaches' },
    { id: 'urlscan', name: 'urlscan.io', category: 'security', url: 'https://urlscan.io/api/v1/search/', auth: 'key', keyEnv: 'URLSCAN_KEY', free: true, limit: '50 req/month', desc: 'URL scanning and analysis' },
    { id: 'phishstats', name: 'PhishStats', category: 'security', url: 'https://phishstats.info/api/v1/phishing', auth: 'none', free: true, limit: 'Unlimited', desc: 'Phishing URL database' },

    // ===== HEALTH & FITNESS APIs (15+) =====
    { id: 'nutritionix', name: 'Nutritionix Nutrition', category: 'health', url: 'https://trackapi.nutritionix.com/v2/natural/nutrients', auth: 'key', keyEnv: 'NUTRITIONIX_KEY', free: true, limit: 'Rate limited', desc: 'Nutrition data from natural language' },
    { id: 'open-food-facts', name: 'Open Food Facts', category: 'health', url: 'https://world.openfoodfacts.org/api/v0/product/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Open food product database' },
    { id: 'usda-food', name: 'USDA FoodData', category: 'health', url: 'https://api.nal.usda.gov/fdc/v1/foods/search', auth: 'key', keyEnv: 'USDA_KEY', free: true, limit: '3600 req/hour', desc: 'USDA food nutritional database' },
    { id: 'fda-drug', name: 'FDA Drug Labels', category: 'health', url: 'https://api.fda.gov/drug/label.json', auth: 'none', free: true, limit: 'Rate limited', desc: 'FDA drug labeling information' },
    { id: 'fda-food', name: 'FDA Food Recalls', category: 'health', url: 'https://api.fda.gov/food/enforcement.json', auth: 'none', free: true, limit: 'Rate limited', desc: 'FDA food recall alerts' },
    { id: 'fda-device', name: 'FDA Medical Devices', category: 'health', url: 'https://api.fda.gov/device/enforcement.json', auth: 'none', free: true, limit: 'Rate limited', desc: 'FDA medical device recalls' },
    { id: 'clinical-trials', name: 'ClinicalTrials.gov', category: 'health', url: 'https://clinicaltrials.gov/api/query/study_fields', auth: 'none', free: true, limit: 'Rate limited', desc: 'Clinical trial database' },
    { id: 'who-data', name: 'WHO Health Data', category: 'health', url: 'https://ghoapi.azureedge.net/api/Indicator', auth: 'none', free: true, limit: 'Unlimited', desc: 'World Health Organization data' },
    { id: 'ncbi-taxonomy', name: 'NCBI Taxonomy', category: 'health', url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', auth: 'none', free: true, limit: '10 req/sec', desc: 'NCBI taxonomy database' },
    { id: 'drugbank', name: 'DrugBank', category: 'health', url: 'https://api.drugbank.com/v1/drugs', auth: 'key', keyEnv: 'DRUGBANK_KEY', free: true, limit: 'Rate limited', desc: 'Drug information database' },
    { id: 'calorieninjas', name: 'CalorieNinjas', category: 'health', url: 'https://api.calorieninjas.com/v1/nutrition', auth: 'key', keyEnv: 'CALORIENINJAS_KEY', free: true, limit: '25000 req/month', desc: 'AI nutrition analysis' },
    { id: 'spoonacular', name: 'Spoonacular Food', category: 'health', url: 'https://api.spoonacular.com/food/products/search', auth: 'key', keyEnv: 'SPOONACULAR_KEY', free: true, limit: '150 req/day', desc: 'Food product and recipe data' },

    // ===== FOOD & DRINK APIs (15+) =====
    { id: 'themealdb', name: 'TheMealDB', category: 'food', url: 'https://www.themealdb.com/api/json/v1/1/random.php', auth: 'none', free: true, limit: 'Unlimited', desc: 'Meal and recipe database' },
    { id: 'themealdb-search', name: 'TheMealDB Search', category: 'food', url: 'https://www.themealdb.com/api/json/v1/1/search.php', auth: 'none', free: true, limit: 'Unlimited', desc: 'Search meals by name' },
    { id: 'themealdb-ingredient', name: 'TheMealDB by Ingredient', category: 'food', url: 'https://www.themealdb.com/api/json/v1/1/filter.php', auth: 'none', free: true, limit: 'Unlimited', desc: 'Filter meals by ingredient' },
    { id: 'thecocktaildb', name: 'TheCocktailDB', category: 'food', url: 'https://www.thecocktaildb.com/api/json/v1/1/random.php', auth: 'none', free: true, limit: 'Unlimited', desc: 'Cocktail recipe database' },
    { id: 'thecocktaildb-search', name: 'TheCocktailDB Search', category: 'food', url: 'https://www.thecocktaildb.com/api/json/v1/1/search.php', auth: 'none', free: true, limit: 'Unlimited', desc: 'Search cocktails by name' },
    { id: 'coffee-api', name: 'Coffee API', category: 'food', url: 'https://www.thecoffeedb.com/api/v1/coffees', auth: 'none', free: true, limit: 'Unlimited', desc: 'Coffee database' },
    { id: 'brewerydb', name: 'Open Brewery DB', category: 'food', url: 'https://api.openbrewerydb.org/v1/breweries', auth: 'none', free: true, limit: 'Unlimited', desc: 'US brewery directory' },
    { id: 'punkapi', name: 'Punk API Beer', category: 'food', url: 'https://api.punkapi.com/v2/beers', auth: 'none', free: true, limit: 'Unlimited', desc: 'BrewDog beer recipes' },
    { id: 'recipe-puppy', name: 'Recipe Puppy', category: 'food', url: 'https://www.recipepuppy.com/api/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Recipe search engine' },
    { id: 'edamam', name: 'Edamam Recipe', category: 'food', url: 'https://api.edamam.com/api/recipes/v2', auth: 'key', keyEnv: 'EDAMAM_KEY', free: true, limit: '10000 req/month', desc: 'Recipe search and nutrition analysis' },
    { id: 'bacon-ipsum', name: 'Bacon Ipsum', category: 'food', url: 'https://baconipsum.com/api/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Bacon-themed placeholder text' },

    // ===== SHOPPING & PRODUCTS APIs (10+) =====
    { id: 'bestbuy', name: 'Best Buy Products', category: 'shopping', url: 'https://api.bestbuy.com/v1/products', auth: 'key', keyEnv: 'BESTBUY_KEY', free: true, limit: 'Rate limited', desc: 'Best Buy product catalog' },
    { id: 'walmart', name: 'Walmart Search', category: 'shopping', url: 'https://developer.walmart.com/api/rest', auth: 'key', keyEnv: 'WALMART_KEY', free: true, limit: 'Rate limited', desc: 'Walmart product search' },
    { id: 'amazon-ads', name: 'Amazon Product API', category: 'shopping', url: 'https://webservices.amazon.com/paapi5/searchitems', auth: 'key', keyEnv: 'AMAZON_KEY', free: true, limit: 'Rate limited', desc: 'Amazon product search' },
    { id: 'etymology', name: 'Product Open Data', category: 'shopping', url: 'https://product-open-data.com/api/v1/products', auth: 'none', free: true, limit: 'Unlimited', desc: 'Open product database' },
    { id: 'priceapi', name: 'PriceAPI', category: 'shopping', url: 'https://api.priceapi.com/v2/jobs', auth: 'key', keyEnv: 'PRICEAPI_KEY', free: true, limit: 'Rate limited', desc: 'Product pricing data' },
    { id: 'reverb', name: 'Reverb Music Gear', category: 'shopping', url: 'https://api.reverb.com/api/listings', auth: 'key', keyEnv: 'REVERB_KEY', free: true, limit: 'Rate limited', desc: 'Music gear marketplace' },
    { id: 'shopify-public', name: 'Shopify Public Products', category: 'shopping', url: 'https://{store}.myshopify.com/products.json', auth: 'none', free: true, limit: 'Rate limited', desc: 'Public Shopify product listings' },
    { id: 'woocommerce', name: 'WooCommerce Products', category: 'shopping', url: 'https://{site}/wp-json/wc/v3/products', auth: 'key', keyEnv: 'WOOCOMMERCE_KEY', free: true, limit: 'Rate limited', desc: 'WooCommerce product data' },
    { id: 'fakestore', name: 'Fake Store API', category: 'shopping', url: 'https://fakestoreapi.com/products', auth: 'none', free: true, limit: 'Unlimited', desc: 'Fake e-commerce product data' },
    { id: 'plentymarkets', name: 'PlentyMarkets', category: 'shopping', url: 'https://{instance}.plentymarkets.com/rest/items', auth: 'key', keyEnv: 'PLENTY_KEY', free: true, limit: 'Rate limited', desc: 'PlentyMarkets item data' },

    // ===== TRANSPORTATION APIs (15+) =====
    { id: 'adsb-exchange', name: 'ADSB Exchange Flights', category: 'transport', url: 'https://api.adsbexchange.com/api/aircraft/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Live aircraft flight data' },
    { id: 'aviation-stack', name: 'AviationStack', category: 'transport', url: 'https://api.aviationstack.com/v1/flights', auth: 'key', keyEnv: 'AVIATION_KEY', free: true, limit: '1000 req/month', desc: 'Real-time flight tracking' },
    { id: 'opensky', name: 'OpenSky Network', category: 'transport', url: 'https://opensky-network.org/api/states/all', auth: 'none', free: true, limit: '10 req/min', desc: 'Live aircraft positions' },
    { id: 'ais-stream', name: 'AIS Vessel Tracking', category: 'transport', url: 'https://ais.stream/v1/ships', auth: 'none', free: true, limit: 'Rate limited', desc: 'Live maritime vessel data' },
    { id: 'marine-traffic', name: 'MarineTraffic', category: 'transport', url: 'https://services.marinetraffic.com/api/exportvessels', auth: 'key', keyEnv: 'MARINETRAFFIC_KEY', free: true, limit: 'Rate limited', desc: 'Ship tracking and ports' },
    { id: 'transit-land', name: 'TransitLand', category: 'transport', url: 'https://transit.land/api/v1/stops', auth: 'none', free: true, limit: 'Rate limited', desc: 'Public transit stop data' },
    { id: 'transloc', name: 'TransLoc Transit', category: 'transport', url: 'https://api.transloc.com/openapi/v1/agencies', auth: 'none', free: true, limit: 'Rate limited', desc: 'Real-time transit vehicle data' },
    { id: 'bike-washington', name: 'Capital Bikeshare', category: 'transport', url: 'https://gbfs.capitalbikeshare.com/gbfs/en/station_status.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Bike share station status' },
    { id: 'citibike', name: 'Citi Bike NYC', category: 'transport', url: 'https://gbfs.citibikenyc.com/gbfs/en/station_status.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'NYC bike share data' },
    { id: 'gbfs', name: 'GBFS Bike Share', category: 'transport', url: 'https://raw.githubusercontent.com/NABSA/gbfs/master/systems.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'All GBFS bike share systems' },
    { id: 'nextbus', name: 'NextBus Transit', category: 'transport', url: 'https://retro.umoiq.com/service/publicJSONFeed', auth: 'none', free: true, limit: 'Rate limited', desc: 'Real-time bus arrival predictions' },
    { id: 'uber', name: 'Uber Estimates', category: 'transport', url: 'https://api.uber.com/v1.2/estimates/price', auth: 'key', keyEnv: 'UBER_KEY', free: true, limit: 'Rate limited', desc: 'Uber price and time estimates' },
    { id: 'lyft', name: 'Lyft Rides', category: 'transport', url: 'https://api.lyft.com/v1/cost', auth: 'key', keyEnv: 'LYFT_KEY', free: true, limit: 'Rate limited', desc: 'Lyft ride cost estimates' },

    // ===== GOVERNMENT & DATA APIs (20+) =====
    { id: 'data-gov', name: 'Data.gov Search', category: 'government', url: 'https://api.data.gov/search/api/v1/search', auth: 'key', keyEnv: 'DATAGOV_KEY', free: true, limit: 'Rate limited', desc: 'US government open data' },
    { id: 'census', name: 'US Census Data', category: 'government', url: 'https://api.census.gov/data/2020/dec/pl', auth: 'none', free: true, limit: 'Unlimited', desc: 'US Census demographic data' },
    { id: 'census-pop', name: 'US Census Population', category: 'government', url: 'https://api.census.gov/data/2021/pep/population', auth: 'none', free: true, limit: 'Unlimited', desc: 'US population estimates' },
    { id: 'bls', name: 'Bureau Labor Statistics', category: 'government', url: 'https://api.bls.gov/publicAPI/v2/timeseries/data/', auth: 'none', free: true, limit: 'Rate limited', desc: 'US labor and employment stats' },
    { id: 'bea', name: 'Bureau Economic Analysis', category: 'government', url: 'https://apps.bea.gov/api/data', auth: 'key', keyEnv: 'BEA_KEY', free: true, limit: 'Rate limited', desc: 'US economic data' },
    { id: 'federal-register', name: 'Federal Register', category: 'government', url: 'https://www.federalregister.gov/api/v1/documents', auth: 'none', free: true, limit: 'Rate limited', desc: 'US federal regulations' },
    { id: 'congress', name: 'Congress.gov API', category: 'government', url: 'https://api.congress.gov/v3/bill', auth: 'key', keyEnv: 'CONGRESS_KEY', free: true, limit: 'Rate limited', desc: 'US Congress bills and data' },
    { id: 'fec', name: 'FEC Campaign Finance', category: 'government', url: 'https://api.open.fec.gov/v1/candidates/', auth: 'key', keyEnv: 'FEC_KEY', free: true, limit: 'Rate limited', desc: 'US campaign finance data' },
    { id: 'epa', name: 'EPA Environmental Data', category: 'government', url: 'https://data.epa.gov/efservice/', auth: 'none', free: true, limit: 'Rate limited', desc: 'EPA environmental datasets' },
    { id: 'usgs-water', name: 'USGS Water Data', category: 'government', url: 'https://waterservices.usgs.gov/nwis/iv/', auth: 'none', free: true, limit: 'Rate limited', desc: 'US water streamflow data' },
    { id: 'noaa-weather', name: 'NOAA Weather Data', category: 'government', url: 'https://www.ncdc.noaa.gov/cdo-web/api/v2/data', auth: 'key', keyEnv: 'NOAA_KEY', free: true, limit: 'Rate limited', desc: 'NOAA climate data online' },
    { id: 'un-data', name: 'UN Data API', category: 'government', url: 'https://data.un.org/ws/rest/data/', auth: 'none', free: true, limit: 'Rate limited', desc: 'United Nations data portal' },
    { id: 'un-hdr', name: 'UN Human Development', category: 'government', url: 'https://hdr.undp.org/api/v1/data/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Human Development Index data' },
    { id: 'oecd', name: 'OECD Data', category: 'government', url: 'https://sdmx.oecd.org/public/rest/v2/dataflow/', auth: 'none', free: true, limit: 'Unlimited', desc: 'OECD economic and social data' },
    { id: 'eurostat', name: 'Eurostat Data', category: 'government', url: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/', auth: 'none', free: true, limit: 'Unlimited', desc: 'EU statistical data' },
    { id: 'worldbank', name: 'World Bank Data', category: 'government', url: 'https://api.worldbank.org/v2/country', auth: 'none', free: true, limit: 'Unlimited', desc: 'World Bank country data' },
    { id: 'who-data-gov', name: 'WHO Data API', category: 'government', url: 'https://ghoapi.azureedge.net/api/DIMENSION', auth: 'none', free: true, limit: 'Unlimited', desc: 'WHO global health indicators' },

    // ===== ENVIRONMENT APIs (15+) =====
    { id: 'open-aq', name: 'Open AQ Air Quality', category: 'environment', url: 'https://api.openaq.org/v3/locations', auth: 'none', free: true, limit: 'Rate limited', desc: 'Global air quality measurements' },
    { id: 'open-aq-cities', name: 'Open AQ by City', category: 'environment', url: 'https://api.openaq.org/v3/health-recommendations', auth: 'none', free: true, limit: 'Rate limited', desc: 'Air quality health recommendations' },
    { id: 'waqi', name: 'WAQI Air Quality', category: 'environment', url: 'https://api.waqi.info/feed/here/', auth: 'key', keyEnv: 'WAQI_KEY', free: true, limit: 'Rate limited', desc: 'World Air Quality Index' },
    { id: 'purple-air', name: 'PurpleAir Sensors', category: 'environment', url: 'https://api.purpleair.com/v1/sensors', auth: 'key', keyEnv: 'PURPLEAIR_KEY', free: true, limit: 'Rate limited', desc: 'PurpleAir sensor network' },
    { id: 'eonet', name: 'NASA EONET Disasters', category: 'environment', url: 'https://eonet.gsfc.nasa.gov/api/v3/events', auth: 'none', free: true, limit: 'Unlimited', desc: 'Natural disaster events' },
    { id: 'eonet-categories', name: 'NASA EONET Categories', category: 'environment', url: 'https://eonet.gsfc.nasa.gov/api/v3/categories', auth: 'none', free: true, limit: 'Unlimited', desc: 'Natural disaster categories' },
    { id: 'gdacs', name: 'GDACS Alerts', category: 'environment', url: 'https://www.gdacs.org/xml/rss.xml', auth: 'none', free: true, limit: 'Unlimited', desc: 'Global disaster alerts' },
    { id: 'nasa-firms', name: 'NASA FIRMS Fires', category: 'environment', url: 'https://firms.modaps.eosdis.nasa.gov/api/country/', auth: 'key', keyEnv: 'NASA_API_KEY', free: true, limit: 'Rate limited', desc: 'Active fire data from MODIS' },
    { id: 'global-forest', name: 'Global Forest Watch', category: 'environment', url: 'https://data-api.globalforestwatch.org/dataset', auth: 'key', keyEnv: 'GFW_KEY', free: true, limit: 'Rate limited', desc: 'Forest cover change data' },
    { id: 'nasa-power', name: 'NASA POWER Climate', category: 'environment', url: 'https://power.larc.nasa.gov/api/temporal/monthly/point', auth: 'none', free: true, limit: 'Rate limited', desc: 'Renewable energy climate data' },
    { id: 'carbon-interface', name: 'Carbon Interface', category: 'environment', url: 'https://www.carboninterface.com/api/v1/estimates', auth: 'key', keyEnv: 'CARBON_KEY', free: true, limit: 'Rate limited', desc: 'Carbon footprint estimation' },
    { id: 'open-cage', name: 'OpenCage Geocoder', category: 'environment', url: 'https://api.opencagedata.com/geocode/v1/json', auth: 'key', keyEnv: 'OPENCAGE_KEY', free: true, limit: '2500 req/day', desc: 'Forward/reverse geocoding' },

    // ===== EDUCATION APIs (15+) =====
    { id: 'college-scorecard', name: 'College Scorecard', category: 'education', url: 'https://api.data.gov/ed/collegescorecard/v1/schools', auth: 'key', keyEnv: 'DATAGOV_KEY', free: true, limit: 'Rate limited', desc: 'US college data and statistics' },
    { id: 'nasa-education', name: 'NASA Education', category: 'education', url: 'https://api.nasa.gov/techtransfer/software/', auth: 'key', keyEnv: 'NASA_API_KEY', free: true, limit: '1000 req/day', desc: 'NASA educational resources' },
    { id: 'quizapi', name: 'QuizAPI', category: 'education', url: 'https://quizapi.io/api/v1/questions', auth: 'key', keyEnv: 'QUIZAPI_KEY', free: true, limit: 'Rate limited', desc: 'Programming and tech quiz questions' },
    { id: 'trivia', name: 'Open Trivia', category: 'education', url: 'https://opentdb.com/api.php', auth: 'none', free: true, limit: 'Unlimited', desc: 'General knowledge trivia' },
    { id: 'google-scholar', name: 'Google Scholar API', category: 'education', url: 'https://serpapi.com/search.json', auth: 'key', keyEnv: 'SERPAPI_KEY', free: true, limit: '100 req/month', desc: 'Google Scholar search results' },
    { id: 'wolfram-alpha', name: 'Wolfram Alpha', category: 'education', url: 'https://api.wolframalpha.com/v2/query', auth: 'key', keyEnv: 'WOLFRAM_KEY', free: true, limit: '2000 req/month', desc: 'Computational knowledge engine' },
    { id: 'merriam-webster', name: 'Merriam-Webster', category: 'education', url: 'https://www.dictionaryapi.com/api/v3/references/collegiate/json/', auth: 'key', keyEnv: 'MW_KEY', free: true, limit: '1000 req/day', desc: 'Merriam-Webster dictionary' },

    // ===== ENTERTAINMENT APIs (15+) =====
    { id: 'bored', name: 'Bored API', category: 'entertainment', url: 'https://www.boredapi.com/api/activity', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random activity suggestions' },
    { id: 'dad-jokes', name: 'Dad Jokes API', category: 'entertainment', url: 'https://icanhazdadjoke.com/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Random dad jokes' },
    { id: 'chuck-norris', name: 'Chuck Norris Jokes', category: 'entertainment', url: 'https://api.chucknorris.io/jokes/random', auth: 'none', free: true, limit: 'Unlimited', desc: 'Chuck Norris fact jokes' },
    { id: 'kanye', name: 'Kanye Rest', category: 'entertainment', url: 'https://api.kanye.rest/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random Kanye West quotes' },
    { id: 'advice', name: 'Advice Slip', category: 'entertainment', url: 'https://api.adviceslip.com/advice', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random advice' },
    { id: 'inspire', name: 'Inspirational Quotes', category: 'entertainment', url: 'https://zenquotes.io/api/random', auth: 'none', free: true, limit: 'Rate limited', desc: 'Inspirational quotes' },
    { id: 'zenquotes', name: 'ZenQuotes.io', category: 'entertainment', url: 'https://zenquotes.io/api/quotes', auth: 'none', free: true, limit: 'Rate limited', desc: 'Author quotes collection' },
    { id: 'anime-quotes', name: 'Anime Quotes', category: 'entertainment', url: 'https://animechan.xyz/api/random', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random anime quotes' },
    { id: 'jokeapi', name: 'JokeAPI', category: 'entertainment', url: 'https://v2.jokeapi.dev/joke/Any', auth: 'none', free: true, limit: 'Unlimited', desc: 'Jokes in multiple categories' },
    { id: 'official-joke', name: 'Official Joke API', category: 'entertainment', url: 'https://official-joke-api.appspot.com/random_joke', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random programmatic jokes' },
    { id: 'breaking-bad', name: 'Breaking Bad Quotes', category: 'entertainment', url: 'https://api.breakingbadquotes.xyz/v1/quotes', auth: 'none', free: true, limit: 'Unlimited', desc: 'Breaking Bad character quotes' },
    { id: 'ron-swanson', name: 'Ron Swanson Quotes', category: 'entertainment', url: 'https://ron-swanson-quotes.herokuapp.com/v2/quotes', auth: 'none', free: true, limit: 'Unlimited', desc: 'Ron Swanson (Parks & Rec) quotes' },
    { id: 'useless-facts', name: 'Useless Facts', category: 'entertainment', url: 'https://uselessfacts.jsph.pl/api/v2/facts/random', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random useless but interesting facts' },

    // ===== SPORTS APIs (15+) =====
    { id: 'openfootball', name: 'OpenFootball Data', category: 'sports', url: 'https://raw.githubusercontent.com/openfootball/football.json/master/2020-21/en.1.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Football/soccer league data' },
    { id: 'football-data', name: 'Football-Data.org', category: 'sports', url: 'https://api.football-data.org/v4/matches', auth: 'key', keyEnv: 'FOOTBALL_KEY', free: true, limit: '100 req/day', desc: 'Football competition data' },
    { id: 'nba', name: 'NBA API', category: 'sports', url: 'https://www.balldontlie.io/api/v1/players', auth: 'none', free: true, limit: 'Unlimited', desc: 'NBA player and game data' },
    { id: 'nba-games', name: 'NBA Games (balldontlie)', category: 'sports', url: 'https://www.balldontlie.io/api/v1/games', auth: 'none', free: true, limit: 'Unlimited', desc: 'NBA game results and schedules' },
    { id: 'nba-teams', name: 'NBA Teams (balldontlie)', category: 'sports', url: 'https://www.balldontlie.io/api/v1/teams', auth: 'none', free: true, limit: 'Unlimited', desc: 'NBA team information' },
    { id: 'mlb', name: 'MLB Stats API', category: 'sports', url: 'https://statsapi.mlb.com/api/v1/teams', auth: 'none', free: true, limit: 'Unlimited', desc: 'MLB team and player stats' },
    { id: 'nhl', name: 'NHL API', category: 'sports', url: 'https://statsapi.web.nhl.com/api/v1/teams', auth: 'none', free: true, limit: 'Unlimited', desc: 'NHL team and player data' },
    { id: 'nfl', name: 'NFL Data', category: 'sports', url: 'https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getTeams', auth: 'key', keyEnv: 'RAPIDAPI_KEY', free: true, limit: 'Rate limited', desc: 'NFL team and game data' },
    { id: 'sportsdb', name: 'TheSportsDB', category: 'sports', url: 'https://www.thesportsdb.com/api/v1/json/3/allteams.php', auth: 'none', free: true, limit: 'Unlimited', desc: 'Multi-sport team and event data' },
    { id: 'sports-schedules', name: 'Sports Schedules', category: 'sports', url: 'https://api.sportradar.us/nba/official/trial/v7/en/games/2023/REG/schedule.json', auth: 'key', keyEnv: 'SPORTRADAR_KEY', free: true, limit: 'Rate limited', desc: 'Sports schedule data' },
    { id: 'ergast', name: 'Ergast F1', category: 'sports', url: 'http://ergast.com/api/f1/current/last/results.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Formula 1 race results' },
    { id: 'f1-data', name: 'F1 Data API', category: 'sports', url: 'https://api.jolpi.ca/ergast/f1/current', auth: 'none', free: true, limit: 'Unlimited', desc: 'F1 championship data' },
    { id: 'cricapi', name: 'CricAPI Cricket', category: 'sports', url: 'https://api.cricapi.com/v1/currentMatches', auth: 'key', keyEnv: 'CRICAPI_KEY', free: true, limit: '100 req/day', desc: 'Live cricket match data' },
    { id: 'cricket-data', name: 'Cricket Data', category: 'sports', url: 'https://api.cricapi.com/v1/countries', auth: 'key', keyEnv: 'CRICAPI_KEY', free: true, limit: '100 req/day', desc: 'Cricket player and match stats' },
    { id: 'sportmonks', name: 'SportMonks Football', category: 'sports', url: 'https://api.sportmonks.com/v3/football/leagues', auth: 'key', keyEnv: 'SPORTMONKS_KEY', free: true, limit: 'Rate limited', desc: 'Football data provider' },
    { id: 'chess-puzzles-api', name: 'Chess Puzzles', category: 'sports', url: 'https://chess-puzzler.herokuapp.com/api/v1/puzzles', auth: 'none', free: true, limit: 'Unlimited', desc: 'Daily chess puzzles' },
    { id: 'surfline', name: 'Surfline Forecasts', category: 'sports', url: 'https://services.surfline.com/kbyg/spots/forecasts', auth: 'none', free: true, limit: 'Rate limited', desc: 'Surf spot forecasts and conditions' }
];

class ApiRegistry {
    constructor() {
        this.apis = API_REGISTRY;
        this.cache = {};
        this.cacheTTL = 5 * 60 * 1000;
        this.stats = { total: this.apis.length, calls: 0, errors: 0 };
    }

    search(query) {
        const q = query.toLowerCase();
        const words = q.split(/\s+/).filter(w => w.length > 1);
        return this.apis.filter(a => {
            const text = (a.name + ' ' + a.category + ' ' + a.desc + ' ' + a.id).toLowerCase();
            const matchCount = words.filter(w => text.includes(w)).length;
            return matchCount > 0;
        }).sort((a, b) => {
            const aCount = words.filter(w => (a.name + ' ' + a.desc).toLowerCase().includes(w)).length;
            const bCount = words.filter(w => (b.name + ' ' + b.desc).toLowerCase().includes(w)).length;
            return bCount - aCount;
        }).slice(0, 20);
    }

    findById(id) { return this.apis.find(a => a.id === id); }

    findByCategory(cat) { return this.apis.filter(a => a.category === cat); }

    getCategories() {
        const cats = new Set(this.apis.map(a => a.category));
        return Array.from(cats).map(c => ({
            id: c,
            name: CATEGORIES[c]?.name || c,
            icon: CATEGORIES[c]?.icon || '📦',
            count: this.apis.filter(a => a.category === c).length
        }));
    }

    async call(apiId, params = {}) {
        const api = this.findById(apiId);
        if (!api) throw new Error(`API not found: ${apiId}`);
        this.stats.calls++;
        let url = api.url;
        for (const [k, v] of Object.entries(params)) url = url.replace(`{${k}}`, encodeURIComponent(v));
        const sep = url.includes('?') ? '&' : '?';
        if (api.auth === 'none') {
        } else if (api.keyEnv) {
            const key = process.env[api.keyEnv];
            if (key) {
                if (api.id.startsWith('gemini')) url += `${sep}key=${key}`;
                else if (api.id.startsWith('hf-')) url += `${sep}api_key=${key}`;
                else if (api.id.includes('deepai')) url += `${sep}api_key=${key}`;
            }
        }
        try {
            const result = await fetchUrl(url);
            if (result.status >= 400) this.stats.errors++;
            try { result.data = JSON.parse(result.data); } catch { }
            return result;
        } catch (e) {
            this.stats.errors++;
            throw e;
        }
    }

    getStats() { return { ...this.stats, categories: this.getCategories().length }; }
}

// Additional APIs to reach 500+ total
const MORE_APIS = [
    // === ADDITIONAL LLM & AI ===
    { id: 'together-llama', name: 'Together AI Llama 3.3', category: 'llm', url: 'https://api.together.xyz/v1/chat/completions', auth: 'key', keyEnv: 'TOGETHER_KEY', free: true, limit: '$1 free', desc: '200+ models via Together AI API' },
    { id: 'together-mistral', name: 'Together AI Mistral', category: 'llm', url: 'https://api.together.xyz/v1/chat/completions', auth: 'key', keyEnv: 'TOGETHER_KEY', free: true, limit: '$1 free', desc: 'Mistral models on Together AI' },
    { id: 'ai21-jamba', name: 'AI21 Jamba 1.5', category: 'llm', url: 'https://api.ai21.com/studio/v1/chat/completions', auth: 'key', keyEnv: 'AI21_KEY', free: true, limit: '$10 free', desc: 'Jamba 1.5 architecture model' },
    { id: 'hf-gemma', name: 'HF Google Gemma 2', category: 'llm', url: 'https://api-inference.huggingface.co/models/google/gemma-2-9b-it', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'Google Gemma 2 9B via HF' },
    { id: 'hf-deepseek', name: 'HF DeepSeek Coder', category: 'llm', url: 'https://api-inference.huggingface.co/models/deepseek-ai/deepseek-coder-6.7b-instruct', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'DeepSeek Coder 6.7B for code' },
    { id: 'hf-olmo', name: 'HF OLMo 7B', category: 'llm', url: 'https://api-inference.huggingface.co/models/allenai/OLMo-7B-Instruct', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'AI2 OLMo 7B open model' },
    { id: 'hf-starcoder', name: 'HF StarCoder2 15B', category: 'llm', url: 'https://api-inference.huggingface.co/models/bigcode/starcoder2-15b-instruct-v0.1', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'Code generation model by BigCode' },
    { id: 'hf-phi3', name: 'HF Phi-3 Medium', category: 'llm', url: 'https://api-inference.huggingface.co/models/microsoft/phi-3-medium-128k-instruct', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'Phi-3 Medium 128K context' },
    { id: 'hf-qwen', name: 'HF Qwen 2.5 72B', category: 'llm', url: 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'Qwen 2.5 72B via HF' },
    { id: 'hf-dbrx', name: 'HF DBRX Instruct', category: 'llm', url: 'https://api-inference.huggingface.co/models/databricks/dbrx-instruct', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'Databricks DBRX Instruct' },
    { id: 'hf-command-r', name: 'HF Command R+', category: 'llm', url: 'https://api-inference.huggingface.co/models/CohereForAI/c4ai-command-r-plus', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'Cohere Command R+ via HF' },
    { id: 'hf-llama-70b', name: 'HF Llama 3.1 70B', category: 'llm', url: 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3.1-70B-Instruct', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'Llama 3.1 70B via HF' },
    { id: 'hf-mixtral', name: 'HF Mixtral 8x7B', category: 'llm', url: 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'Mixtral MoE 8x7B via HF' },
    { id: 'hf-solar', name: 'HF Solar 10.7B', category: 'llm', url: 'https://api-inference.huggingface.co/models/upstage/SOLAR-10.7B-Instruct-v1.0', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'Upstage Solar 10.7B via HF' },
    { id: 'hf-vicuna', name: 'HF Vicuna 13B', category: 'llm', url: 'https://api-inference.huggingface.co/models/lmsys/vicuna-13b-v1.5', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'Vicuna 13B v1.5 via HF' },
    { id: 'hf-gpt2', name: 'HF GPT-2 Large', category: 'llm', url: 'https://api-inference.huggingface.co/models/openai-community/gpt2-large', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'OpenAI GPT-2 Large text generation' },
    { id: 'hf-llama-8b', name: 'HF Llama 3.2 8B', category: 'llm', url: 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-8B-Instruct', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'Llama 3.2 8B via HF' },
    { id: 'hf-bloom', name: 'HF BLOOM 7B', category: 'llm', url: 'https://api-inference.huggingface.co/models/bigscience/bloom-7b1', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'BigScience BLOOM 7.1B' },
    { id: 'hf-falcon', name: 'HF Falcon 7B', category: 'llm', url: 'https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct', auth: 'key', keyEnv: 'HF_API_KEY', free: true, limit: '300 req/hr', desc: 'TII Falcon 7B Instruct' },

    // === ADDITIONAL WEATHER ===
    { id: 'meteostat', name: 'Meteostat Weather', category: 'weather', url: 'https://meteostat.p.rapidapi.com/point/daily', auth: 'key', keyEnv: 'RAPIDAPI_KEY', free: true, limit: '500 req/day', desc: 'Historical weather and climate data' },
    { id: 'storm-weather', name: 'Storm Glass Weather', category: 'weather', url: 'https://api.stormglass.io/v2/weather/point', auth: 'key', keyEnv: 'STORMGLASS_KEY', free: true, limit: '50 req/day', desc: 'Marine weather and tide data' },
    { id: 'weatherbit', name: 'Weatherbit.io', category: 'weather', url: 'https://api.weatherbit.io/v2.0/current', auth: 'key', keyEnv: 'WEATHERBIT_KEY', free: true, limit: '500 req/day', desc: 'Current weather and forecasts' },
    { id: 'aerisweather', name: 'AerisWeather', category: 'weather', url: 'https://api.aerisapi.com/observations/', auth: 'key', keyEnv: 'AERIS_KEY', free: true, limit: '250 req/day', desc: 'Weather observations and maps' },
    { id: 'climacell', name: 'ClimaCell Weather', category: 'weather', url: 'https://api.tomorrow.io/v4/timelines', auth: 'key', keyEnv: 'TOMORROW_API_KEY', free: true, limit: '500 req/day', desc: 'Hyperlocal weather data' },
    { id: 'ncdc-noaa', name: 'NOAA Climate Data', category: 'weather', url: 'https://www.ncdc.noaa.gov/cdo-web/api/v2/data', auth: 'key', keyEnv: 'NOAA_KEY', free: true, limit: 'Rate limited', desc: 'NOAA climate data sets' },

    // === ADDITIONAL FINANCE ===
    { id: 'marketstack', name: 'Marketstack Stocks', category: 'finance', url: 'https://api.marketstack.com/v1/eod', auth: 'key', keyEnv: 'MARKETSTACK_KEY', free: true, limit: '1000 req/month', desc: 'End-of-day stock data' },
    { id: 'currencylayer', name: 'Currencylayer', category: 'finance', url: 'https://api.currencylayer.com/live', auth: 'key', keyEnv: 'CURRENCYLAYER_KEY', free: true, limit: '250 req/month', desc: 'Live currency exchange rates' },
    { id: 'fixer', name: 'Fixer.io FX', category: 'finance', url: 'https://data.fixer.io/api/latest', auth: 'key', keyEnv: 'FIXER_KEY', free: true, limit: '100 req/month', desc: 'Foreign exchange rates' },
    { id: 'commodities-api', name: 'Commodities API', category: 'finance', url: 'https://www.commodities-api.com/api/latest', auth: 'key', keyEnv: 'COMMODITIES_KEY', free: true, limit: '100 req/month', desc: 'Commodities price data' },
    { id: 'oilprice', name: 'Oil Price API', category: 'finance', url: 'https://api.oilpriceapi.com/v1/prices/latest', auth: 'key', keyEnv: 'OILPRICE_KEY', free: true, limit: 'Rate limited', desc: 'Crude oil and energy prices' },
    { id: 'gold-api', name: 'Gold API', category: 'finance', url: 'https://www.gold-api.com/api/XAU/USD/latest', auth: 'key', keyEnv: 'GOLDAPI_KEY', free: true, limit: 'Rate limited', desc: 'Gold spot prices' },
    { id: 'investpy', name: 'Investing.com Data', category: 'finance', url: 'https://investing-cryptocurrency-markets.p.rapidapi.com/coins/list', auth: 'key', keyEnv: 'RAPIDAPI_KEY', free: true, limit: 'Rate limited', desc: 'Financial market data' },
    { id: 'morningstar', name: 'Morningstar Data', category: 'finance', url: 'https://api.morningstar.com/v2/quickrank', auth: 'key', keyEnv: 'MORNINGSTAR_KEY', free: true, limit: 'Rate limited', desc: 'Fund and ETF data' },

    // === ADDITIONAL NEWS ===
    { id: 'currents', name: 'Currents API', category: 'news', url: 'https://api.currentsapi.services/v1/latest-news', auth: 'key', keyEnv: 'CURRENTS_KEY', free: true, limit: '100 req/day', desc: 'Latest news from 15,000+ sources' },
    { id: 'newscatcher', name: 'Newscatcher API', category: 'news', url: 'https://api.newscatcherapi.com/v2/latest_headlines', auth: 'key', keyEnv: 'NEWSCATCHER_KEY', free: true, limit: '500 req/day', desc: 'News headlines aggregation' },
    { id: 'news-api-ai', name: 'News API AI', category: 'news', url: 'https://newsapi.ai/api/v1/article/getArticles', auth: 'key', keyEnv: 'NEWSAPI_AI_KEY', free: true, limit: 'Rate limited', desc: 'AI-powered news aggregation' },
    { id: 'factcheck', name: 'Google Fact Check', category: 'news', url: 'https://factchecktools.googleapis.com/v1alpha1/claims:search', auth: 'key', keyEnv: 'GOOGLE_API_KEY', free: true, limit: '100 req/day', desc: 'Fact check search across the web' },
    { id: 'politifact', name: 'PolitiFact', category: 'news', url: 'https://politifact.com/api/v2/statements/', auth: 'none', free: true, limit: 'Rate limited', desc: 'PolitiFact fact-checking data' },

    // === ADDITIONAL SCIENCE ===
    { id: 'biodiversity', name: 'GBIF Biodiversity', category: 'science', url: 'https://api.gbif.org/v1/occurrence/search', auth: 'none', free: true, limit: 'Rate limited', desc: 'Global biodiversity occurrence data' },
    { id: 'itis', name: 'ITIS Species', category: 'science', url: 'https://www.itis.gov/ITISWebService/jsonservice/get ITISWebService/searchByScientificName', auth: 'none', free: true, limit: 'Rate limited', desc: 'Integrated Taxonomic Information System' },
    { id: 'ebird', name: 'eBird Observations', category: 'science', url: 'https://api.ebird.org/v2/data/obs/CA/recent', auth: 'key', keyEnv: 'EBIRD_KEY', free: true, limit: 'Rate limited', desc: 'Bird observation data from Cornell Lab' },
    { id: 'inaturalist', name: 'iNaturalist Observations', category: 'science', url: 'https://api.inaturalist.org/v1/observations', auth: 'none', free: true, limit: 'Rate limited', desc: 'Nature observation data' },
    { id: 'phylopic', name: 'Phylopic Silhouettes', category: 'science', url: 'https://api.phylopic.org/v2/images/random', auth: 'none', free: true, limit: 'Unlimited', desc: 'Organism silhouette images' },
    { id: 'trefle', name: 'Trefle Plants', category: 'science', url: 'https://trefle.io/api/v1/plants', auth: 'key', keyEnv: 'TREFLE_KEY', free: true, limit: 'Rate limited', desc: 'Global plant species database' },
    { id: 'opencage', name: 'OpenCage Geocoder', category: 'science', url: 'https://api.opencagedata.com/geocode/v1/json', auth: 'key', keyEnv: 'OPENCAGE_KEY', free: true, limit: '2500 req/day', desc: 'Forward and reverse geocoding' },
    { id: 'marine-debris', name: 'NOAA Marine Debris', category: 'science', url: 'https://marinedebris.noaa.gov/api/v1/items', auth: 'none', free: true, limit: 'Rate limited', desc: 'Marine debris monitoring data' },

    // === ADDITIONAL DEVELOPMENT ===
    { id: 'gitlab-issues', name: 'GitLab Issues', category: 'development', url: 'https://gitlab.com/api/v4/projects/{id}/issues', auth: 'key', keyEnv: 'GITLAB_TOKEN', free: true, limit: '2000 req/min', desc: 'GitLab issue tracking' },
    { id: 'bitbucket-pipelines', name: 'Bitbucket Pipelines', category: 'development', url: 'https://api.bitbucket.org/2.0/repositories/{owner}/{repo}/pipelines/', auth: 'key', keyEnv: 'BITBUCKET_KEY', free: true, limit: '1000 req/hour', desc: 'Bitbucket CI/CD pipeline data' },
    { id: 'circleci', name: 'CircleCI Pipelines', category: 'development', url: 'https://circleci.com/api/v2/project/{project}/pipeline', auth: 'key', keyEnv: 'CIRCLECI_KEY', free: true, limit: 'Rate limited', desc: 'CircleCI pipeline status' },
    { id: 'jenkins', name: 'Jenkins Job Status', category: 'development', url: 'https://{jenkins-url}/api/json', auth: 'key', keyEnv: 'JENKINS_KEY', free: true, limit: 'Rate limited', desc: 'Jenkins build server data' },
    { id: 'sonatype', name: 'Sonatype Nexus', category: 'development', url: 'https://nexus.{domain}/service/rest/v1/search', auth: 'key', keyEnv: 'NEXUS_KEY', free: true, limit: 'Rate limited', desc: 'Maven artifact repository search' },
    { id: 'jfrog', name: 'JFrog Artifactory', category: 'development', url: 'https://{instance}.jfrog.io/artifactory/api/search/aql', auth: 'key', keyEnv: 'JFROG_KEY', free: true, limit: 'Rate limited', desc: 'Binary repository manager' },
    { id: 'terraform-registry', name: 'Terraform Registry', category: 'development', url: 'https://registry.terraform.io/v1/providers', auth: 'none', free: true, limit: 'Unlimited', desc: 'Terraform provider registry' },
    { id: 'pulumi', name: 'Pulumi Registry', category: 'development', url: 'https://api.pulumi.com/api/console/packages', auth: 'none', free: true, limit: 'Rate limited', desc: 'Pulumi infrastructure packages' },
    { id: 'serverless', name: 'Serverless Framework', category: 'development', url: 'https://api.serverless.com/v1/applications', auth: 'key', keyEnv: 'SERVERLESS_KEY', free: true, limit: 'Rate limited', desc: 'Serverless app registry' },
    { id: 'cloudflare-dns', name: 'Cloudflare DNS', category: 'development', url: 'https://api.cloudflare.com/client/v4/zones', auth: 'key', keyEnv: 'CLOUDFLARE_API_KEY', free: true, limit: '1200 req/5min', desc: 'Cloudflare DNS management' },
    { id: 'vercel', name: 'Vercel Deployments', category: 'development', url: 'https://api.vercel.com/v6/deployments', auth: 'key', keyEnv: 'VERCEL_KEY', free: true, limit: 'Rate limited', desc: 'Vercel deployment API' },
    { id: 'netlify', name: 'Netlify Sites', category: 'development', url: 'https://api.netlify.com/api/v1/sites', auth: 'key', keyEnv: 'NETLIFY_KEY', free: true, limit: 'Rate limited', desc: 'Netlify site management' },
    { id: 'heroku', name: 'Heroku Apps', category: 'development', url: 'https://api.heroku.com/apps', auth: 'key', keyEnv: 'HEROKU_KEY', free: true, limit: 'Rate limited', desc: 'Heroku platform API' },
    { id: 'supabase', name: 'Supabase Management', category: 'development', url: 'https://api.supabase.com/v1/projects', auth: 'key', keyEnv: 'SUPABASE_KEY', free: true, limit: 'Rate limited', desc: 'Supabase project management' },
    { id: 'firebase', name: 'Firebase Extensions', category: 'development', url: 'https://firebase.googleapis.com/v1beta1/projects/{project}/extensions', auth: 'key', keyEnv: 'FIREBASE_KEY', free: true, limit: 'Rate limited', desc: 'Firebase extensions registry' },
    { id: 'mongodb-atlas', name: 'MongoDB Atlas', category: 'development', url: 'https://cloud.mongodb.com/api/atlas/v1.0/groups', auth: 'key', keyEnv: 'MONGODB_KEY', free: true, limit: 'Rate limited', desc: 'MongoDB Atlas cluster management' },

    // === ADDITIONAL SECURITY ===
    { id: 'internetdb', name: 'InternetDB', category: 'security', url: 'https://internetdb.io/api/v1/{ip}', auth: 'none', free: true, limit: 'Unlimited', desc: 'IP address open port scanning' },
    { id: 'criminal-ip', name: 'Criminal IP', category: 'security', url: 'https://api.criminalip.io/v1/ip/data', auth: 'key', keyEnv: 'CRIMINALIP_KEY', free: true, limit: '100 req/day', desc: 'Threat intelligence IP lookup' },
    { id: 'greynoise', name: 'GreyNoise Context', category: 'security', url: 'https://api.greynoise.io/v3/community/{ip}', auth: 'key', keyEnv: 'GREYNOISE_KEY', free: true, limit: 'Rate limited', desc: 'IP context and noise classification' },
    { id: 'pulsedive', name: 'Pulsedive Threat Intel', category: 'security', url: 'https://pulsedive.com/api/info.php', auth: 'key', keyEnv: 'PULSEDIVE_KEY', free: true, limit: '1000 req/day', desc: 'Threat indicator intelligence' },
    { id: 'threatfox', name: 'ThreatFox IoC', category: 'security', url: 'https://threatfox-api.abuse.ch/api/v1/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Indicator of compromise database' },
    { id: 'malwarebazaar', name: 'MalwareBazaar', category: 'security', url: 'https://mb-api.abuse.ch/api/v1/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Malware sample database' },
    { id: 'urlhaus', name: 'URLhaus', category: 'security', url: 'https://urlhaus-api.abuse.ch/v1/url/', auth: 'none', free: true, limit: 'Rate limited', desc: 'Malicious URL database' },
    { id: 'sslmate', name: 'SSL Mate Certificates', category: 'security', url: 'https://sslmate.com/api/v2/certificates', auth: 'key', keyEnv: 'SSLMATE_KEY', free: true, limit: 'Rate limited', desc: 'SSL certificate transparency data' },
    { id: 'censys', name: 'Censys Search', category: 'security', url: 'https://search.censys.io/api/v2/hosts/search', auth: 'key', keyEnv: 'CENSYS_KEY', free: true, limit: '250 req/month', desc: 'Internet asset discovery' },
    { id: 'binaryedge', name: 'BinaryEdge', category: 'security', url: 'https://api.binaryedge.io/v2/query/dataindex', auth: 'key', keyEnv: 'BINARYEDGE_KEY', free: true, limit: 'Rate limited', desc: 'Internet reconnaissance data' },
    { id: 'fortiguard', name: 'FortiGuard Threat Intel', category: 'security', url: 'https://fortiguard.com/api/v1/iprep/', auth: 'none', free: true, limit: 'Rate limited', desc: 'IP reputation categories' },

    // === ADDITIONAL TRANSPORT ===
    { id: 'nhtsa', name: 'NHTSA Vehicle Safety', category: 'transport', url: 'https://api.nhtsa.gov/SafetyRatings', auth: 'none', free: true, limit: 'Unlimited', desc: 'Vehicle safety ratings and recalls' },
    { id: 'vpic', name: 'VPIC Vehicle Specs', category: 'transport', url: 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Vehicle VIN decoding' },
    { id: 'fuel-price', name: 'Fuel Price API', category: 'transport', url: 'https://www.fueleconomy.gov/ws/rest/fuelprices', auth: 'none', free: true, limit: 'Unlimited', desc: 'Current US fuel prices' },
    { id: 'transitland-routes', name: 'TransitLand Routes', category: 'transport', url: 'https://transit.land/api/v1/routes', auth: 'none', free: true, limit: 'Rate limited', desc: 'Public transit route data' },
    { id: 'citybik', name: 'CityBik Stations', category: 'transport', url: 'https://api.citybik.es/v2/networks', auth: 'none', free: true, limit: 'Unlimited', desc: 'Worldwide bike share networks' },
    { id: 'uber-products', name: 'Uber Products', category: 'transport', url: 'https://api.uber.com/v1.2/products', auth: 'key', keyEnv: 'UBER_KEY', free: true, limit: 'Rate limited', desc: 'Uber ride type availability' },
    { id: 'lyft-eta', name: 'Lyft ETA', category: 'transport', url: 'https://api.lyft.com/v1/eta', auth: 'key', keyEnv: 'LYFT_KEY', free: true, limit: 'Rate limited', desc: 'Lyft estimated arrival times' },

    // === ADDITIONAL HEALTH ===
    { id: 'covid-act', name: 'COVID Act Now', category: 'health', url: 'https://api.covidactnow.org/v2/country/US.json', auth: 'key', keyEnv: 'COVIDACT_KEY', free: true, limit: 'Rate limited', desc: 'US COVID-19 data by county' },
    { id: 'disease-sh', name: 'Disease.sh Global', category: 'health', url: 'https://disease.sh/v3/covid-19/historical/all', auth: 'none', free: true, limit: 'Unlimited', desc: 'Global disease tracking data' },
    { id: 'health-gov', name: 'Health.gov API', category: 'health', url: 'https://health.gov/api/v1/health', auth: 'none', free: true, limit: 'Unlimited', desc: 'US health recommendations' },
    { id: 'medline', name: 'MedlinePlus Health', category: 'health', url: 'https://medlineplus.gov/mplus/display/display.go', auth: 'none', free: true, limit: 'Unlimited', desc: 'Health information from NIH' },
    { id: 'rxnav', name: 'RxNav Drug Info', category: 'health', url: 'https://rxnav.nlm.nih.gov/REST/drugs?name=', auth: 'none', free: true, limit: 'Unlimited', desc: 'Drug information from NLM' },
    { id: 'dailymed', name: 'DailyMed Drug Labels', category: 'health', url: 'https://dailymed.nlm.nih.gov/dailymed/services/v2/drugnames.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'FDA drug labeling from NLM' },

    // === ADDITIONAL ENTERTAINMENT ===
    { id: 'movie-quotes', name: 'Movie Quotes API', category: 'entertainment', url: 'https://movie-quotes-api.herokuapp.com/api/v1/random', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random movie quotes' },
    { id: 'programming-quotes', name: 'Programming Quotes', category: 'entertainment', url: 'https://programming-quotes-api.herokuapp.com/quotes/random', auth: 'none', free: true, limit: 'Unlimited', desc: 'Programming-related quotes' },
    { id: 'geek-jokes', name: 'Geek Jokes API', category: 'entertainment', url: 'https://geek-jokes.sameerkumar.website/api?format=json', auth: 'none', free: true, limit: 'Unlimited', desc: 'Geek/nerd humor jokes' },
    { id: 'foaas', name: 'Fuck Off As A Service', category: 'entertainment', url: 'https://foaas.com/random', auth: 'none', free: true, limit: 'Unlimited', desc: 'Creative insult generation' },
    { id: 'corporate-bs', name: 'Corporate BS Generator', category: 'entertainment', url: 'https://corporatebs-generator.sameerkumar.website/', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random corporate jargon phrases' },
    { id: 'techy', name: 'Techy Quotes', category: 'entertainment', url: 'https://techy.herokuapp.com/api/quote', auth: 'none', free: true, limit: 'Unlimited', desc: 'Technology themed quotes' },
    { id: 'trivia-hard', name: 'Hard Trivia Questions', category: 'entertainment', url: 'https://opentdb.com/api.php?amount=1&difficulty=hard', auth: 'none', free: true, limit: 'Unlimited', desc: 'Hard difficulty trivia' },
    { id: 'number-trivia', name: 'Number Trivia', category: 'entertainment', url: 'http://numbersapi.com/random/trivia', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random number trivia facts' },
    { id: 'year-facts', name: 'Year Facts', category: 'entertainment', url: 'http://numbersapi.com/random/year', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random year historical facts' },
    { id: 'cat-facts', name: 'Cat Facts', category: 'entertainment', url: 'https://catfact.ninja/fact', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random cat facts' },
    { id: 'dog-facts', name: 'Dog Facts', category: 'entertainment', url: 'https://dog-api.kinduff.com/api/facts', auth: 'none', free: true, limit: 'Unlimited', desc: 'Random dog facts' },
    { id: 'random-stuff', name: 'Random Stuff API', category: 'entertainment', url: 'https://random-stuff-api.p.rapidapi.com/ai', auth: 'key', keyEnv: 'RAPIDAPI_KEY', free: true, limit: 'Rate limited', desc: 'AI generated random content' },

    // === ADDITIONAL ENVIRONMENT ===
    { id: 'global-warming', name: 'Global Warming API', category: 'environment', url: 'https://global-warming.org/api/temperature-api', auth: 'none', free: true, limit: 'Unlimited', desc: 'Global temperature anomaly data' },
    { id: 'co2-emissions', name: 'CO2 Emissions API', category: 'environment', url: 'https://global-warming.org/api/co2-api', auth: 'none', free: true, limit: 'Unlimited', desc: 'Atmospheric CO2 concentration data' },
    { id: 'methane', name: 'Methane Levels API', category: 'environment', url: 'https://global-warming.org/api/methane-api', auth: 'none', free: true, limit: 'Unlimited', desc: 'Atmospheric methane data' },
    { id: 'no2-levels', name: 'NO2 Levels API', category: 'environment', url: 'https://global-warming.org/api/nitrous-oxide-api', auth: 'none', free: true, limit: 'Unlimited', desc: 'Nitrous oxide concentration data' },
    { id: 'arctic-ice', name: 'Arctic Ice Extent', category: 'environment', url: 'https://global-warming.org/api/arctic-api', auth: 'none', free: true, limit: 'Unlimited', desc: 'Arctic sea ice extent data' },
    { id: 'open-epi', name: 'Open EPI Data', category: 'environment', url: 'https://api.epi.yale.edu/api/v1/indicators', auth: 'none', free: true, limit: 'Rate limited', desc: 'Environmental Performance Index' },
    { id: 'iucn-redlist', name: 'IUCN Red List', category: 'environment', url: 'https://apiv3.iucnredlist.org/api/v3/species', auth: 'key', keyEnv: 'IUCN_KEY', free: true, limit: 'Rate limited', desc: 'Endangered species data' },
    { id: 'tree-species', name: 'Tree Species DB', category: 'environment', url: 'https://tree-species-api.herokuapp.com/api/v1/species', auth: 'none', free: true, limit: 'Rate limited', desc: 'Global tree species database' },

    // === ADDITIONAL SPORTS ===
    { id: 'mlb-schedule', name: 'MLB Schedule', category: 'sports', url: 'https://statsapi.mlb.com/api/v1/schedule', auth: 'none', free: true, limit: 'Unlimited', desc: 'MLB game schedule and results' },
    { id: 'nba-scores', name: 'NBA Scores', category: 'sports', url: 'https://cdn.nba.com/static/json/liveData/scoreboard/todayScoreBoard.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'NBA live scores and standings' },
    { id: 'nfl-scores', name: 'NFL Scores', category: 'sports', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', auth: 'none', free: true, limit: 'Unlimited', desc: 'NFL live scores and schedules' },
    { id: 'nhl-schedule', name: 'NHL Schedule', category: 'sports', url: 'https://statsapi.web.nhl.com/api/v1/schedule', auth: 'none', free: true, limit: 'Unlimited', desc: 'NHL game schedule and scores' },
    { id: 'ncaa-scores', name: 'NCAA Scores', category: 'sports', url: 'https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/01/01/scoreboard.json', auth: 'none', free: true, limit: 'Unlimited', desc: 'NCAA basketball scores' },
    { id: 'espn-headlines', name: 'ESPN Headlines', category: 'sports', url: 'https://site.api.espn.com/apis/site/v2/sports/headlines', auth: 'none', free: true, limit: 'Unlimited', desc: 'ESPN sports news headlines' },
    { id: 'world-rugby', name: 'World Rugby Rankings', category: 'sports', url: 'https://www.world.rugby/api/v3/rankings/mru', auth: 'none', free: true, limit: 'Rate limited', desc: 'World rugby union rankings' },
    { id: 'tennis-atp', name: 'ATP Tennis Rankings', category: 'sports', url: 'https://www.atptour.com/en/rankings/singles', auth: 'none', free: true, limit: 'Rate limited', desc: 'ATP singles tennis rankings' },
    { id: 'golf-leaderboard', name: 'Golf Leaderboard', category: 'sports', url: 'https://golf-leaderboard-data.p.rapidapi.com/leaderboard', auth: 'key', keyEnv: 'RAPIDAPI_KEY', free: true, limit: 'Rate limited', desc: 'PGA tour leaderboard data' },
    { id: 'ufc-stats', name: 'UFC Stats', category: 'sports', url: 'https://api.ufc.com/api/v3/fighters', auth: 'none', free: true, limit: 'Rate limited', desc: 'UFC fighter statistics' },
    { id: 'olympics', name: 'Olympics Data', category: 'sports', url: 'https://apis.olympic.org/api/v1/sports', auth: 'key', keyEnv: 'OLYMPIC_KEY', free: true, limit: 'Rate limited', desc: 'Olympic games and medal data' },

    // === ADDITIONAL EDUCATION ===
    { id: 'openstax', name: 'OpenStax Textbooks', category: 'education', url: 'https://openstax.org/api/v1/books', auth: 'none', free: true, limit: 'Unlimited', desc: 'Free college textbook catalog' },
    { id: 'khan-academy', name: 'Khan Academy Topics', category: 'education', url: 'https://www.khanacademy.org/api/v1/topics', auth: 'none', free: true, limit: 'Rate limited', desc: 'Khan Academy topic tree' },
    { id: 'coursera', name: 'Coursera Courses', category: 'education', url: 'https://api.coursera.org/api/courses.v1', auth: 'none', free: true, limit: 'Rate limited', desc: 'Coursera course catalog' },
    { id: 'edx', name: 'edX Courses', category: 'education', url: 'https://api.edx.org/api/v1/catalog/search', auth: 'key', keyEnv: 'EDX_KEY', free: true, limit: 'Rate limited', desc: 'edX course search and catalog' },
    { id: 'udemy', name: 'Udemy Courses', category: 'education', url: 'https://www.udemy.com/api-2.0/courses', auth: 'key', keyEnv: 'UDEMY_KEY', free: true, limit: 'Rate limited', desc: 'Udemy course listings' },
    { id: 'google-scholar-metrics', name: 'Google Scholar Metrics', category: 'education', url: 'https://scholar.google.com/scholar_metrics', auth: 'none', free: true, limit: 'Rate limited', desc: 'Academic publication metrics' },
    { id: 'doaj', name: 'DOAJ Journals', category: 'education', url: 'https://doaj.org/api/v2/search/articles', auth: 'none', free: true, limit: 'Rate limited', desc: 'Directory of Open Access Journals' },
    { id: 'core-ac', name: 'CORE Academic Papers', category: 'education', url: 'https://api.core.ac.uk/v3/search/works', auth: 'key', keyEnv: 'CORE_KEY', free: true, limit: 'Rate limited', desc: 'Aggregated academic paper search' },
    { id: 'zenodo', name: 'Zenodo Research', category: 'education', url: 'https://zenodo.org/api/records', auth: 'none', free: true, limit: 'Rate limited', desc: 'Open research data repository' },
    { id: 'figshare', name: 'Figshare Research', category: 'education', url: 'https://api.figshare.com/v2/articles', auth: 'none', free: true, limit: 'Rate limited', desc: 'Research data articles repository' },
    { id: 'datacite', name: 'DataCite DOIs', category: 'education', url: 'https://api.datacite.org/dois', auth: 'none', free: true, limit: 'Rate limited', desc: 'DOI registration agency for research' },

    // === ADDITIONAL REFERENCE ===
    { id: 'openaq', name: 'OpenAQ Air Quality', category: 'reference', url: 'https://api.openaq.org/v3/locations', auth: 'none', free: true, limit: 'Rate limited', desc: 'Global air quality monitoring data' },
    { id: 'eur-lex', name: 'EUR-Lex Law', category: 'reference', url: 'https://eur-lex.europa.eu/api/v1/search', auth: 'none', free: true, limit: 'Rate limited', desc: 'EU law and legislation' },
    { id: 'loc-gov', name: 'Library of Congress', category: 'reference', url: 'https://www.loc.gov/items/', auth: 'none', free: true, limit: 'Unlimited', desc: 'US Library of Congress catalog' },
    { id: 'british-library', name: 'British Library', category: 'reference', url: 'https://api.bl.uk/metadata/v1/search', auth: 'key', keyEnv: 'BL_KEY', free: true, limit: 'Rate limited', desc: 'British Library catalog search' },
    { id: 'worldcat', name: 'WorldCat Search', category: 'reference', url: 'https://www.worldcat.org/api/v1.0/search', auth: 'key', keyEnv: 'WORLDCAT_KEY', free: true, limit: 'Rate limited', desc: 'WorldCat library catalog search' },
    { id: 'viaf', name: 'VIAF Authority', category: 'reference', url: 'https://viaf.org/viaf/search', auth: 'none', free: true, limit: 'Rate limited', desc: 'Virtual International Authority File' },
    { id: 'geonames', name: 'GeoNames Lookup', category: 'reference', url: 'https://api.geonames.org/searchJSON', auth: 'key', keyEnv: 'GEONAMES_KEY', free: true, limit: '20000 req/day', desc: 'Geographical database lookup' },
    { id: 'opencorporates', name: 'OpenCorporates', category: 'reference', url: 'https://api.opencorporates.com/v0.4/companies/search', auth: 'none', free: true, limit: '1000 req/day', desc: 'Company registration data worldwide' },
    { id: 'crunchbase', name: 'Crunchbase Companies', category: 'reference', url: 'https://api.crunchbase.com/v4/data/entities/organizations', auth: 'key', keyEnv: 'CRUNCHBASE_KEY', free: true, limit: 'Rate limited', desc: 'Company and startup data' },

    // === ADDITIONAL BUSINESS ===
    { id: 'clearbit', name: 'Clearbit Company', category: 'business', url: 'https://company.clearbit.com/v1/domains/find', auth: 'key', keyEnv: 'CLEARBIT_KEY', free: true, limit: '50 req/month', desc: 'Company domain lookup' },
    { id: 'hunter-io', name: 'Hunter Email Finder', category: 'business', url: 'https://api.hunter.io/v2/domain-search', auth: 'key', keyEnv: 'HUNTER_KEY', free: true, limit: '25 req/month', desc: 'Find emails from company domain' },
    { id: 'zoominfo', name: 'ZoomInfo Company', category: 'business', url: 'https://api.zoominfo.com/v1/companies', auth: 'key', keyEnv: 'ZOOMINFO_KEY', free: true, limit: 'Rate limited', desc: 'Company intelligence data' },
    { id: 'glassdoor', name: 'Glassdoor Reviews', category: 'business', url: 'https://api.glassdoor.com/api/api.htm', auth: 'key', keyEnv: 'GLASSDOOR_KEY', free: true, limit: 'Rate limited', desc: 'Company reviews and ratings' },
    { id: 'indeed', name: 'Indeed Jobs', category: 'business', url: 'https://api.indeed.com/v2/jobs/search', auth: 'key', keyEnv: 'INDEED_KEY', free: true, limit: 'Rate limited', desc: 'Job search and listings' },
    { id: 'linkedin-jobs', name: 'LinkedIn Job Search', category: 'business', url: 'https://api.linkedin.com/v2/jobs', auth: 'key', keyEnv: 'LINKEDIN_KEY', free: true, limit: 'Rate limited', desc: 'LinkedIn job search API' },
    { id: 'uspto', name: 'USPTO Patents', category: 'business', url: 'https://developer.uspto.gov/ds-api/patent/application/v1/query', auth: 'none', free: true, limit: 'Rate limited', desc: 'US Patent and Trademark data' },
    { id: 'sec-edgar', name: 'SEC EDGAR Filings', category: 'business', url: 'https://www.sec.gov/cgi-bin/browse-edgar', auth: 'none', free: true, limit: '10 req/sec', desc: 'SEC company filings database' },
    { id: 'fred', name: 'FRED Economic Data', category: 'business', url: 'https://api.stlouisfed.org/fred/series/observations', auth: 'key', keyEnv: 'FRED_KEY', free: true, limit: 'Rate limited', desc: 'Federal Reserve economic data' },
];

// Merge all APIs
// Merge all into API_REGISTRY
const initialLength = API_REGISTRY.length;
for (const api of MORE_APIS) {
    API_REGISTRY.push(api);
    if (!CATEGORIES[api.category]) {
        CATEGORIES[api.category] = { name: api.category.charAt(0).toUpperCase() + api.category.slice(1), icon: '📦' };
    }
}
console.error(`ApiRegistry: ${initialLength} base + ${MORE_APIS.length} additional = ${API_REGISTRY.length} total`);

module.exports = { ApiRegistry, API_REGISTRY, CATEGORIES };
