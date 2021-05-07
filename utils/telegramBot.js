const { Telegraf, session, Scenes } = require('telegraf')
require('dotenv').config()
const { admin } = require('./firebaseConfig')
const moment = require('moment');
const { listEvents, authorize, getOauthClient, SCOPES } = require('./calendarMethods');

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
            console.log(ctx.chat.id)
            const oAuth2Client = await getOauthClient(this.credentials)
            ctx.scene.enter('authScene')
            this.getAccessToken(oAuth2Client, authScene)
        })

        //this.bot.on('message', (ctx) => ctx.reply('Try /configure'))
        this.bot.launch()
        
    }

    async inlineQuery(credentials, ctx) {
        console.log(ctx.update.inline_query.from)
        const events = await listEvents(credentials, ctx.update.inline_query.from.id)
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

            oAuth2Client.getToken(ctx.message.text, (err, token) => {
                console.log(token)
                if (err) {
                    console.log("leave"); 
                    ctx.scene.leave('authScene')
                    return ctx.replyWithMarkdown('Something went wrong with the code you submitted. Try again starting again the procedure typing /configure');
                }

                admin
                .database()
                .ref(`/configurations/`)
                .child(ctx.chat.id).set(token)

                ctx.replyWithMarkdown(`You are now authorized to use this bot.
Just type \`@BookMyCalendarBot\` in any chat to print out your availabilities retrieved from your personal Calendar.`)
                oAuth2Client.setCredentials(token);
                console.log("leave"); 
                ctx.scene.leave('authScene')
            })   
        })
    }
}



module.exports = { TelegramBot }