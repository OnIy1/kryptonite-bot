const fs = require('fs');
const path = require('path');

const coinsFilePath = path.join(__dirname, '../data/coins.json');

module.exports = (client) => {
    if (fs.existsSync(coinsFilePath)) {
        try {
            const data = fs.readFileSync(coinsFilePath, 'utf8');
            client.coins = JSON.parse(data);
            console.log('✅ Loaded coins.json.');
        } catch (err) {
            console.error('❌ Failed loading coins.json:', err);
        }
    } else {
        console.log('⚠️ No coins.json found, starting fresh.');
    }
};
