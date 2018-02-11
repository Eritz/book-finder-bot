const express = require('express');
const builder = require('botbuilder');
const translate = require('google-translate-api');

const lng = require('./lngOptions');


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
        session.send("Hi there!  \nThis bot will translate messages you entered back to  \na different language.")
        session.send("Here are the available commands:  \n`--begin` will begin the bot  \n`--restart` will restart  \n`--change-to` will change languages translated   \n`--quit` will quit");
        session.endDialog();
    }
]);
// Allow the bot to listen for posted messages
server.post("/api/messages", connector.listen());

// Bot Dialogs and logic

// Language to type in
bot.dialog('/from', [
    function (session) {
        session.send("You can quit anytime by typing `--quit`");
        builder.Prompts.choice(session, "What language will you be typing in?", lng, {listStyle : builder.ListStyle.button})
        session.send("You can type or click the language   \nyou'll be typing in.");
    },
    function (session, results) {
        session.userData.from_lang = lng[results.response.entity];
        builder.Prompts.confirm(session,
             "Just to confirm, you're going  \nto be typing in " + session.userData.from_lang.name + "?  \nYou can enter `yes` or `no`.");
    },
    function (session, results) {
        if (results.response) {
            session.beginDialog('/to');
        } else {
            session.replaceDialog('/from', {reprompt: true});
        }
    }
])
.triggerAction({
    matches: [/^--restart/i, /^--begin/i],
    onSelectAction: (session, args, next) => {
        next();
    }
})


// Choosing a language option
bot.dialog('/to', [
    function (session) {
        builder.Prompts.choice(session, "What language do you want me to speak back?", lng, {listStyle : builder.ListStyle.button});
        session.send("You can type or click the language you  \nwant me to reply back in.");
    },
    function (session, results) {
        session.userData.to_lang = lng[results.response.entity]
        builder.Prompts.confirm(session, "You wanted " + session.userData.to_lang.name + " right?  \nYou can enter `yes` or `no`.");
    },
    function (session, results) {
        if (results.response) {
            session.send("Okay, I was just checking.  \nYou can start typing now. Have fun!");
            session.beginDialog('/translate');
        } else {
            session.replaceDialog('/to', {reprompt: true});
        }
    }
])
.triggerAction({
    matches: /^--change-to/i,
})

// Translating based on the options chosen.
bot.dialog('/translate', [
    function (session, results) {
        if (!session.message.text.match(/^\s*$/)) {
            session.sendTyping();
            translate(session.message.text, {from: session.userData.from_lang.lang, to: session.userData.to_lang.lang})
            .then((res) => session.send(res.text))
            .catch((err) => session.send("Oh seemed like there was an error. Try again.  \n" + err));
        }
    }
]);


bot.endConversationAction("endTranslate", "Sure, translations will be stopped now.",{matches : /^--quit/i});