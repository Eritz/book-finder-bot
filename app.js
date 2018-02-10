const express = require('express');
const builder = require('botbuilder');
const translate = require('google-translate-api');

const intents = require('./intents');
const lng = require('./lngOptions');


// Start server
const server = express();
const port = process.env.PORT || 3978;
server.listen(port, function() {
    console.log("Listening on port: " + port);
});


// Set up the Bot

// Create a chat connector for communicating with the Bot Framework Service 
const connector = new builder.ChatConnector({
    // Local does not need app_id and app_password
    appId: process.env.APP_ID,
    appPassword: process.env.APP_PASSWORD
});
// Create a bot instance that uses the connector
const bot = new builder.UniversalBot(connector);
// Allow the bot to listen for posted messages
server.post("/api/messages", connector.listen());

// Bot Dialogs and logic

bot.dialog('/', intents);

bot.dialog('/start', [
    function(session) {
        session.send("Hi. You can type anything you want, and I'll translate it back with Google.  \nType `Begin` to start a translation session.");
        session.endDialog();
    }
]);

// Choosing a language option
bot.dialog('/choose', [
    function (session) {
        session.send("You can cancel anytime by typing `cancel`");
        builder.Prompts.choice(session, "What language do you want me to speak back?", lng, {listStyle : builder.ListStyle.button});
        session.send("You can type the language or click an option.");
    },
    function (session, results) {
        session.userData.choice = lng[results.response.entity]
        builder.Prompts.confirm(session, "You wanted " + session.userData.choice.name + " right?  \nYou can enter `yes` or `no`.");
    },
    function (session, results) {
        if (results.response) {
            session.send("Okay, I was just checking. Have fun!");
            session.beginDialog('/translate');
        } else {
            session.replaceDialog('/choose', {reprompt: true});
        }
    }
]).endConversationAction("endTranslate", "Sure, translations will be stopped now.",{matches : /^cancel/i});

// Translating based on the option chosen.
bot.dialog('/translate', [
    function (session, results) {
        translate(results.response, {from: 'en', to: session.userData.choice.lang})
        .then((res) => session.send(res.text))
    }
]);