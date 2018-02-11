const builder = require('botbuilder');
const intents = new builder.IntentDialog();


intents.matches(/^begin/i, [
    function(session) {
        session.beginDialog('/from')
    }
])

/**
 * onDefault can take an array of function(session),
 * but this app will only need one function(session)
 * element. This element will inform the user to start.
 */
intents.onDefault([
    function(session) {
        session.beginDialog('/start');
    }
]);



module.exports = intents;