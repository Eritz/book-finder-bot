const express = require('express');
const builder = require('botbuilder');
const translate = require('google-translate-api');

const lng = require('./lngOptions');
const speech = require('./index');


// Start server
const server = express();
const port = process.env.PORT || 3978;
server.listen(port, function() {
    console.log("Listening on port: " + port);
});

// Bot Configuration

// Create a chat connector for communicating with the Bot Framework Service 
const connector = new builder.ChatConnector({
    // Local does not need app_id and app_password
    appId: process.env.APP_ID,
    appPassword: process.env.APP_PASSWORD
});
// Create a bot instance that uses the connector
const bot = new builder.UniversalBot(connector, [
    function(session) {
        session.send(speech.BOT_GREETING)
        session.send(speech.BOT_COMMANDS);
        session.endDialog();
    }
]);
// Allow the bot to listen for posted messages
server.post("/api/messages", connector.listen());

/////////////////////////////////////////////////////
// Bot Dialogs and logic

// Language to type in
bot.dialog('/from', [
    function (session) {
        builder.Prompts.choice(session, speech.BOT_TRANSLATE_FROM, lng, {listStyle : builder.ListStyle.list})
        session.send(speech.BOT_TYPE_CLICK_FROM);
    },
    function (session, results) {
        session.userData.from_lang = lng[results.response.entity];
        builder.Prompts.confirm(session,
             "Just to confirm, you're going  \nto be typing in " + session.userData.from_lang.name + speech.BOT_YES_OR_NO);
    },
    function (session, results) {
        if (results.response) {
            session.endDialog();
            session.beginDialog('/to');
        } else {
            session.replaceDialog('/from', {reprompt: true});
        }
    }
])
.triggerAction({
    matches: [/^\/restart/i, /^\/begin/i],
    onSelectAction: (session, args, next) => {
        next();
    }
})


// Choosing a language option
bot.dialog('/to', [
    function (session) {
        builder.Prompts.choice(session, speech.BOT_TRANSLATE_TO, lng, {listStyle : builder.ListStyle.list});
        session.send(speech.BOT_TYPE_CLICK_TO);
    },
    function (session, results) {
        session.userData.to_lang = lng[results.response.entity]
        builder.Prompts.confirm(session, "You wanted " + session.userData.to_lang.name + speech.BOT_YES_OR_NO);
    },
    function (session, results) {
        if (results.response) {
            session.send(speech.BOT_CONFIRM);
            session.send(speech.BOT_QUIT_REMINDER);
            session.endDialog();            
            session.beginDialog('/translate');
        } else {
            session.replaceDialog('/to', {reprompt: true});
        }
    }
])
.triggerAction({
    matches: /^\/change/i,
})

// Translating based on the options chosen.
bot.dialog('/translate', [
    function (session, results) {
        translate(session.message.text, {from: session.userData.from_lang.lang, to: session.userData.to_lang.lang})
        .then((res) => session.sendTyping().send(res.text))
        .catch((err) => session.send("Oh seemed like there was an error. Try again.  \n" + err));
    }
]);

// The help message
bot.customAction({
    matches: /\/help/i,
    onSelectAction: (session, args, next) => {
        session.send(speech.BOT_COMMANDS);
    }
})

// The about message
bot.customAction({
    matches: /\/about/i,
    onSelectAction: (session, args, next) => {
        session.send(speech.BOT_ABOUT);
    }
})

bot.endConversationAction("endTranslate", speech.BOT_QUIT,{matches : /^\/quit/i});