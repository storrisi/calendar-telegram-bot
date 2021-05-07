const { Telegraf, session, Scenes } = require('telegraf')
require('dotenv').config()
const moment = require('moment');
const { listEvents, authorize, SCOPES } = require('./calendarMethods');

const { enter, leave } = Scenes.Stage
const authScene = new Scenes.BaseScene('authScene');


class TelegramBot {
    constructor(credentials) {
        console.log(process.env.BOT_TOKEN)
        this.credentials = credentials 
    }

    init() {
        console.log(this)
        this.bot = new Telegraf(process.env.BOT_TOKEN)
        const stage = new Scenes.Stage([authScene], {
            ttl: 10,
        })
        this.bot.use(session())
        this.bot.use(stage.middleware())
        this.bot.start((ctx) => ctx.reply('Type /configure to start'))
        
        

        this.bot.on('inline_query', (ctx) => this.inlineQuery(this.credentials, ctx))

        this.bot.command("configure", async (ctx) => {
            console.log(ctx.scene)
            const oAuth2Client = await authorize(this.credentials)
            ctx.scene.enter('authScene')
            this.getAccessToken(oAuth2Client, authScene)
        })
        this.bot.on('message', (ctx) => ctx.reply('Try /configure'))
        this.bot.launch()
        
    }

    async inlineQuery(credentials, ctx) {
        const events = await listEvents(credentials)
        const result = [{
            type: 'article',
            title: "Show Next Week Calendar Slots",
            id: moment().toISOString(),
            input_message_content: {
                message_text: events,
                parse_mode: "Markdown"
            },
        }]
        
        return ctx.answerInlineQuery(result)
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     */
    getAccessToken(oAuth2Client, authScene) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        authScene.enter((ctx) => ctx.reply(`Authorize this app by visiting this url: ${authUrl}

Enter the code from that page here:`))
        authScene.command('cancel',() => {
            console.log("leave")
            leave()
        })

        authScene.on('message', (ctx) => {
            console.log(ctx.message.text)
            console.log("leave"); 
            ctx.scene.leave('authScene')
            ctx.replyWithMarkdown(`You are now authorized to use this bot.
Just type \`@BookMyCalendarBot\` in any chat to print out your availabilities retrieved from your personal Calendar.`)
        })

        /*const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
            });
        });*/
    }
}



module.exports = { TelegramBot }