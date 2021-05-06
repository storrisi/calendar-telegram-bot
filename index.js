const { Telegraf } = require('telegraf')
require('dotenv').config()
const fs = require('fs');
const moment = require('moment');
const { listEvents } = require('./calendarMethods');

console.log(process.env.BOT_TOKEN)

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Welcome'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Load client secrets from a local file.
fs.readFile('credentials.json', async (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials
    const credentials = JSON.parse(content)
    
    bot.on('inline_query', async (ctx) => {
        const events = await listEvents(credentials)

        console.log(events)
        const result = [{
            type: 'article',
            title: "Show Next Week Calendar Slots",
            id: "2322",
            input_message_content: {
                message_text: events,
                parse_mode: "Markdown"
            },
        }]
        
        return ctx.answerInlineQuery(result)
    });
});