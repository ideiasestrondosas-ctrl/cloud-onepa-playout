const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend/public/locales');
const newVersion = 'v2.2.0-ALPHA.37-PRO';
const todayDate = '2026-03-09';
const changes = [
  "Added manual connection test dialog in the network status menu for realtime websocket debugging.",
  "Upgraded system to connection state tracking, adding reconnect logic when connection closes.",
  "Fixed issue where missing program ID in EPG response would prevent full schedule from displaying."
];

function findAndUpdateReleases(obj) {
  let updated = false;
  
  if (Array.isArray(obj)) {
    // If we're an array, check if we're dealing with the releases array
    if (obj.length > 0 && obj[0].version && obj[0].date && obj[0].changes) {
      if (obj[0].version !== newVersion) {
        obj.unshift({
          version: newVersion,
          date: todayDate,
          changes: changes
        });
        return true;
      }
    }
    
    for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'object' && obj[i] !== null) {
            if (findAndUpdateReleases(obj[i])) updated = true;
        }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    if (obj.releases && Array.isArray(obj.releases)) {
        if (obj.releases.length > 0 && obj.releases[0].version && obj.releases[0].date && obj.releases[0].changes) {
            if (obj.releases[0].version !== newVersion) {
                obj.releases.unshift({
                    version: newVersion,
                    date: todayDate,
                    changes: changes
                });
                updated = true;
            }
        }
    }
    
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && key !== 'releases') {
        if (findAndUpdateReleases(obj[key])) updated = true;
      }
    }
  }
  return updated;
}

const langs = ['en', 'pt', 'es', 'fr'];
langs.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (findAndUpdateReleases(data)) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
      console.log(`Updated translations for ${lang}`);
    } else {
      console.log(`No updates made or 'releases' not found for ${lang}`);
    }
  }
});
