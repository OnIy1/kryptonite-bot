const fs = require('fs');
const path = require('path');
const embedBuilder = require('../../handlers/embedBuilder');
const config = require('../../config.json');

module.exports = {
    name: 'setspamtime',
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
            return message.reply('❌ You are not authorized to change spam cooldown.');
        }

        if (!args[0]) {
            return message.reply('❌ Usage: `!setspamtime <5sec / 1min>`');
        }

        const input = args[0].toLowerCase();
        let newCooldownSec = 0;

        if (input.endsWith('sec')) {
            const seconds = parseInt(input.replace('sec', ''));
            if (isNaN(seconds) || seconds < 1 || seconds > 60) {
                return message.reply('❌ Only 1-60 seconds allowed.');
            }
            newCooldownSec = seconds;
        } else if (input.endsWith('min')) {
            const minutes = parseInt(input.replace('min', ''));
            if (isNaN(minutes) || minutes < 1 || minutes > 10) {
                return message.reply('❌ Only 1-10 minutes allowed.');
            }
            newCooldownSec = minutes * 60;
        } else {
            return message.reply('❌ Invalid format. Use `sec` or `min`, like `5sec` or `1min`.');
        }

        // Update config
        config.messageCooldown = newCooldownSec;
        
        // Save updated config
        fs.writeFileSync(path.join(__dirname, '..', '..', 'config.json'), 
                         JSON.stringify(config, null, 2));

        const embed = embedBuilder.createEmbed(
            '⏱️ Spam Cooldown Updated',
            `Spam cooldown is now set to **${newCooldownSec} seconds**.`,
            client
        );

        await message.channel.send({ embeds: [embed] });

        // Log to kryptonite-logs channel
        const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
        if (logChannels.size > 0) {
            const logChannel = logChannels.first();
            const logEmbed = embedBuilder.createEmbed(
                'Spam Cooldown Updated',
                `${message.author.tag} changed spam cooldown to ${newCooldownSec} seconds.`,
                client
            );
            logChannel.send({ embeds: [logEmbed] }).catch(console.error);
        }
    }
};