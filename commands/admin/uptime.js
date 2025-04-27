const embedBuilder = require('../../handlers/embedBuilder');

module.exports = {
    name: 'uptime',
    async execute(client, message, args) {
        const totalSeconds = Math.floor(process.uptime());
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor(totalSeconds / 3600) % 24;
        const minutes = Math.floor(totalSeconds / 60) % 60;
        const seconds = totalSeconds % 60;

        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const embed = embedBuilder.createEmbed(
            '🕒 Kryptonite Uptime',
            `The bot has been online for **${uptimeString}**.`,
            client
        );

        await message.channel.send({ embeds: [embed] });

        // Log to kryptonite-logs channel
        const logChannels = message.guild.channels.cache.filter(c => c.name === 'kryptonite-logs');
        if (logChannels.size > 0) {
            const logChannel = logChannels.first();
            const logEmbed = embedBuilder.createEmbed(
                'Uptime Checked',
                `${message.author.tag} checked uptime (${uptimeString}).`,
                client
            );
            logChannel.send({ embeds: [logEmbed] }).catch(console.error);
        }
    }
};