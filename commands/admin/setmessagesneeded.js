const fs = require('fs');
const path = require('path');
const embedBuilder = require('../../handlers/embedBuilder');
const config = require('../../config.json');

module.exports = {
    name: 'setmessagesneeded',
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
            return message.reply('❌ You are not authorized to change messages needed.');
        }

        if (!args[0] || isNaN(args[0])) {
            return message.reply('❌ Usage: `!setmessagesneeded <number>` (example: `!setmessagesneeded 10`)');
        }

        const newAmount = parseInt(args[0]);
        if (newAmount < 1 || newAmount > 100) {
            return message.reply('❌ Please set between **1** and **100** messages needed.');
        }

        // Update config
        config.coinsPerMessages = newAmount;
        
        // Save updated config
        fs.writeFileSync(path.join(__dirname, '..', '..', 'config.json'), 
                        JSON.stringify(config, null, 2));

        const embed = embedBuilder.createEmbed(
            '🛠️ Messages Needed Updated',
            `Now **${newAmount}** messages = **1 coin**.`,
            client
        );

        await message.channel.send({ embeds: [embed] });

        // Log to kryptonite-logs channel
        const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
        if (logChannels.size > 0) {
            const logChannel = logChannels.first();
            const logEmbed = embedBuilder.createEmbed(
                'Messages Needed Updated',
                `${message.author.tag} updated messages needed to ${newAmount}.`,
                client
            );
            logChannel.send({ embeds: [logEmbed] }).catch(console.error);
        }
    }
};