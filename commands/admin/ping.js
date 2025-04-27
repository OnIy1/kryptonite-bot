module.exports = {
    name: 'ping',
    async execute(client, message, args) {
        const ping = Math.round(client.ws.ping);
        await message.reply(`🏓 Pong! Latency is **${ping}ms**.`);
    }
};
