const http = require('http');

// Configuration
const SCRAPE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const TARGET_URL = 'http://localhost:3000/api/cron/scrape';

console.log(`🚀 Scraper Daemon started.`);
console.log(`⏱️  Configured to scrape every ${SCRAPE_INTERVAL_MS / 1000 / 60} minutes.`);
console.log(`🎯 Target: ${TARGET_URL}`);

function triggerScrape() {
  console.log(`\n[${new Date().toISOString()}] 📡 Triggering background scrape...`);
  
  const req = http.get(TARGET_URL, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`[${new Date().toISOString()}] ✅ Scrape successful (Status: ${res.statusCode})`);
      } else {
        console.error(`[${new Date().toISOString()}] ❌ Scrape failed (Status: ${res.statusCode})`);
        console.error(data);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] 💥 Error triggering scrape:`, err.message);
  });
}

// Run immediately on start
triggerScrape();

// Set interval to run continuously
setInterval(triggerScrape, SCRAPE_INTERVAL_MS);
