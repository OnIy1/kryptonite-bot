const fs = require('fs');
const path = require('path');
const embedBuilder = require('../../handlers/embedBuilder');
const config = require('../../config.json');

module.exports = {
    name: 'ahelp',
    async execute(client, message, args) {
        // Load trust data
        const trustPath = path.join(__dirname, '..', '..', 'data', 'trust.json');
        let trustData = {};
        
        try {
            trustData = JSON.parse(fs.readFileSync(trustPath, 'utf8'));
        } catch (error) {
            // If file doesn't exist or is corrupt, create new
            fs.writeFileSync(trustPath, JSON.stringify({}, null, 2));
        }

        if (message.author.id !== config.ownerId && !trustData[message.author.id]) {
            return message.reply('❌ You are not authorized to view admin commands.');
        }

        const embed = embedBuilder.createEmbed(
            '👑 Kryptonite Admin Help',
            'Here are the commands trusted users and the owner can use:',
            client,
            [
                { name: '💰 Economy Control', value: '`!addcoins @user <amount>`\n`!removecoins @user <amount>`\n`!setcoins @user <amount>`\n`!massaddcoins <amount>`\n`!massremovecoins <amount>`\n`!clearcoins`' },
                { name: '🔧 Trust System', value: '`!trust add @user`\n`!trust remove @user`' },
                { name: '⚡ Boost Management', value: '`!booststart <multiplier> <duration>`\n`!booststatus`' },
                { name: '⏱️ Settings', value: '`!setspamtime <time>`\n`!setmessagesneeded <number>`' },
                { name: '🛠️ Bot Management', value: '`!restart`\n`!uptime`\n`!ping`' }
            ]
        );

        await message.channel.send({ embeds: [embed] });
    }
};