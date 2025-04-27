const fs = require('fs');
const path = require('path');

const coinsFilePath = path.join(__dirname, '../data/coins.json');

module.exports = async (client) => {
    try {
        if (!fs.existsSync(path.join(__dirname, '../data'))) {
            fs.mkdirSync(path.join(__dirname, '../data'));
        }

        const data = JSON.stringify(client.coins, null, 4);
        fs.writeFileSync(coinsFilePath, data, 'utf8');
        console.log('💾 Saved coins.json successfully.');
    } catch (err) {
        console.error('❌ Error saving coins.json:', err);
    }
};
