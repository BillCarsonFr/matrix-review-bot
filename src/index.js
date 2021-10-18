const sdk = require("matrix-bot-sdk");

const MatrixClient = sdk.MatrixClient;
const SimpleFsStorageProvider = sdk.SimpleFsStorageProvider;
//const AutojoinRoomsMixin = sdk.AutojoinRoomsMixin;
const RichReply = sdk.RichReply;

const RssFeedEmitter = require('rss-feed-emitter');
const appleTemplate = require("./appstore-review-msg.js").AppleTemplate;
const androidTemplate = require("./playstore-review-msg.js").PlaystoreTemplate;
var gplay = require('google-play-scraper');

const botConfig = require('../conf/config.json')
const AndroidFeedEmitter = require('./playstore/android-review-feed-emitter');


// where you would point a client to talk to a homeserver
const homeserverUrl = botConfig.bot.homeserverUrl;

// see https://t2bot.io/docs/access_tokens
const accessToken = botConfig.bot.accessToken;

// We'll want to make sure the bot doesn't have to do an initial sync every
// time it restarts, so we need to prepare a storage provider. Here we use
// a simple JSON database.
const storage = new SimpleFsStorageProvider("appstore-bot.json");

// Now we can create the client and set it up to automatically join rooms.
const client = new MatrixClient(homeserverUrl, accessToken, storage);
// AutojoinRoomsMixin.setupOnClient(client);

// We also want to make sure we can receive events - this is where we will
// handle our command.
client.on("room.message", handleCommand);

client.on("room.invite", (roomId, inviteEvent) => {
    console.log("## Received invite for room " + roomId)
    let config = botConfig.rooms[roomId]
    console.log("## Config is " + config)
    if (config) {
        client.joinRoom(roomId).then( res => {

        config.watchedApps.forEach(element => {
            console.log("## Configure for " + element)
            if (element.type == "android") {
                watchPlaystoreReviews(roomId, element, config.skipFirstLoad)
            } else if (element.type == "ios") {
                watchAppleReviews(roomId, element, config.skipFirstLoa)
            }
        })

        let watchedInfo = config.watchedApps
                            .map( info => `app:${info.appId} for ${info.type}`)
                            .join(" and ")


        let message = `Hello!\nI am currently watching ${watchedInfo}\nI will send you new reviews as they come.`
            client.sendNotice(roomId, message)
        }).catch((error) => {
            //Code si la promesse a échoué
            console.log("## Failed to join room " + roomId)
        });
        
    }
});

// Now that the client is all set up and the event handler is registered, start the
// client up. This will start it syncing.
client.start().then(() => console.log("Client started!"));

client.getJoinedRooms().then(function(joinedRoomIds) {
    console.log(`## Joined rooms ${joinedRoomIds}`);
    for (const roomId in botConfig.rooms) {
        console.log(`## Found config for room ${roomId}`);
        console.log(`## Is room joined ${joinedRoomIds.includes(roomId)}`);
        if (joinedRoomIds.includes(roomId)) {
            // bot already in that room, let's start the emitters
            let roomConfig = botConfig.rooms[roomId]
            roomConfig.watchedApps.forEach(element => {
                console.log("## Configure for " + JSON.stringify(element))
                if (element.type == "android") {
                    watchPlaystoreReviews(roomId, element, roomConfig.skipFirstLoad)
                } else if (element.type == "ios") {
                    watchAppleReviews(roomId, element, roomConfig.skipFirstLoad)
                }
            })
        }
    } 
});



// This is our event handler for dealing with the `!hello` command.
async function handleCommand(roomId, event) {
    // Don't handle events that don't have contents (they were probably redacted)
    if (!event["content"]) return;

    // Don't handle non-text events
    if (event["content"]["msgtype"] !== "m.text") return;

    // We never send `m.text` messages so this isn't required, however this is
    // how you would filter out events sent by the bot itself.
    if (event["sender"] === await client.getUserId()) return;

    // Make sure that the event looks like a command we're expecting
    const body = event["content"]["body"];
    // console.log("## Body is " + body)
    if (!body || !body.startsWith("!review")) return;

    // Check to see what the arguments were to the command
    const args = body.substring("!review".length).trim().split(' ');

    try {
        console.log("## args[0] is " + args[0])
        if (args[0] === "hello") {
            // If we've reached this point, we can safely execute the command. We'll
            // send a reply to the user's command saying "Hello World!".
            const replyBody = "Hello World!"; // we don't have any special styling to do.
            const reply = RichReply.createFor(roomId, event, replyBody, replyBody);
            eply["msgtype"] = "m.notice";
            client.sendMessage(roomId, reply);
        } else if(args[0] === "test") {
            // emitAll(roomId)
            let config = botConfig.rooms[roomId]
            config.watchedApps.forEach(element => {
                if (element.type == "android") {
                    emitLatestAndroid(roomId, element.appId, element.title_prefix)
                } else if (element.type == "ios") {
                    emitLatestIos(roomId, element.appId, element.title_prefix)
                }
            })
        }
    } catch (e) {
        // Log the error
        LogService.error("CommandHandler", e);

        // Tell the user there was a problem
        const message = "There was an error processing your command";
        const reply = RichReply.createFor(roomId, ev, message, message); // We don't need to escape the HTML because we know it is safe
        reply["msgtype"] = "m.notice";
        return this.client.sendMessage(roomId, reply);
    }
}

function watchAppleReviews(roomId, element, skipFirstLoad) {
    const feeder = new RssFeedEmitter({skipFirstLoad});
    const {appId, language, title_prefix} = element
        
    language.forEach(code => {
        let split = code.split("-")
        // TODO add a quick check to see if country code ok
        feeder.add({
            url: `https://itunes.apple.com/${split[0]}/rss/customerreviews/id=${appId}/sortBy=mostRecent/xml`,
            refresh: 60000
        });
    })

    feeder.on('new-item', function(item) {
        console.log("On New Item :\n" +  JSON.stringify(item))
        client.sendHtmlNotice(roomId, appleTemplate.richText(title_prefix, item))
        //console.log(appleTemplate.richText(item));
    })
    feeder.on('error', console.error);
}

function watchPlaystoreReviews(roomId, element, skipFirstLoad) {
    const { appId, language, title_prefix} = element;
    const feeder = new AndroidFeedEmitter({skipFirstLoad});
    
    language.forEach(code => {
        let split = code.split("-")
        feeder.add({
            appId: appId,
            country: split[0],
            lang: split[1],
            refresh: 60000
        });
    })

    feeder.on('new-item', function(item) {
        console.log("On New android Item " +  JSON.stringify(item))
        client.sendHtmlNotice(roomId, androidTemplate.richText(title_prefix, item))
        //console.log(androidTemplate.richText(item));
    })
    feeder.on('error', console.error);
}

function emitLatestIos(roomId, appId, title) { 
    let Parser = require('rss-parser');
    let parser = new Parser();

    (async () => {

    let feed = await parser.parseURL(`https://itunes.apple.com/us/rss/customerreviews/id=${appId}/sortBy=mostRecent/xml`);

    feed.items.slice(0, 1).forEach(item => {
        console.log("On New apple Item")
        client.sendHtmlNotice(roomId, appleTemplate.richTextTest(title, item))
    });

    })();
}
  
function emitLatestAndroid(roomId, appId, title) { 

    gplay.reviews({
        appId: appId,
        sort: gplay.sort.NEWEST,
        num: 1
      }).then( function (resp) {
          resp.data.forEach(element => {
            //console.log("scrap: " + JSON.stringify(element))
            client.sendHtmlNotice(roomId, androidTemplate.richText(title, element))
          });
      }, function (err) {
          console.log("Error: " + err)
      });

}