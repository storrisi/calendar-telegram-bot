require('dotenv').config()
const fs = require('fs');
const { TelegramBot } = require('./utils/telegramBot');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Load client secrets from a local file.
fs.readFile('credentials.json', async (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials
    const credentials = JSON.parse(content)

    const telegramBot = new TelegramBot(credentials)
    telegramBot.init()
});