require('dotenv').config()
const fs = require('fs');
const readline = require('readline');
const moment = require('moment');
const { google } = require('googleapis');
const Event = require('./EventClass');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
 async function authorize(credentials) {
    return new Promise((resolve) => {
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getAccessToken(oAuth2Client);
            oAuth2Client.setCredentials(JSON.parse(token));
            resolve(oAuth2Client)
        })
    })
}

/**
 * Lists the next week free slts on the user's primary calendar.
 * @param {Object} credentials The authorization client credentials.
 */
async function listEvents(credentials) {
    return new Promise(async (resolve) => {
        const auth = await authorize(credentials)
        console.log(auth)
        const calendar = google.calendar({ version: 'v3', auth });
        calendar.freebusy.query({requestBody: {
            "timeMin": moment().toISOString(),
            "timeMax": moment().add(7, "days").hour(23).minutes(59).toISOString(),
            "items": [
            {
                "id": "storrisi@gmail.com",           
            },
            {
                "id": "team@tomorrowdevs.com",          
            },
            ]
        }},{
            fields: "calendars", 
            alt:"json"
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const events = res.data;
            const eventClass = new Event()
            const eventCalendars = Object.keys(events.calendars).reduce((previousValue, currentValue) => {
                return previousValue.concat(events.calendars[currentValue].busy)
            }, [])
            resolve(eventClass.getFreeSlots(eventCalendars))
        });
    })
}


module.exports = { authorize, listEvents, SCOPES }