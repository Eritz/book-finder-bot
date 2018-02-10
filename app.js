const express = require('express');
const builder = require('botbuilder');
const intents = require('./intents');

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
        session.send("Hi. Type `Begin` to start looking for book prices with your ISBN.");
        session.endDialog();
    }
]);

bot.dialog('/isbn', [
    function (session) {
        session.send("An example input would be `1574321196`")
        builder.Prompts.text(session, "What is the ISBN value?");
    },
    function (session, results) {
        session.userData.input = results.response;
        builder.Prompts.confirm(session, "Got it. Just to confirm, it's " + session.userData.input + " right?  \nYou can enter `yes` or `no`.");
    },
    function (session, results) {
        if (results.response) {
            session.send("Alright! Hang tight.");
            session.beginDialog('/search')
        } else {
            session.send("Okay. Let's try that again.");
            session.replaceDialog('/isbn', { reprompt: true })
        }
        
    }
]);

bot.dialog('/search', [
    function (session) {
        session.send("You can cancel anytime by typing `cancel`");
    },
    function (session) {
        session.send("Searching Amazon...");

    }
]).endConversationAction("endSearch", "Sure, the search has now been ended.",{matches : /^cancel/i});

