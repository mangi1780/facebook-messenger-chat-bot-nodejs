require("dotenv").config();
import request from "request";

let postWebhook = (req, res) =>{
    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);


            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
};

let getWebhook = (req, res) => {
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = process.env.MY_VERIFY_FB_TOKEN;

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
};

// Handles messages events
// function handleMessage(sender_psid, received_message) {
//     let response;
//
//     // Check if the message contains text
//     if (received_message.text) {
//
//         // Create the payload for a basic text message
//         response = {
//             "text": `You sent the message: "${received_message.text}". Now send me an image!`
//         }
//     } else if (received_message.attachments) {
//
//     // Gets the URL of the message attachment
//     let attachment_url = received_message.attachments[0].payload.url;
//         response = {
//             "attachment": {
//                 "type": "template",
//                 "payload": {
//                     "template_type": "generic",
//                     "elements": [{
//                         "title": "Is this the right picture?",
//                         "subtitle": "Tap a button to answer.",
//                         "image_url": attachment_url,
//                         "buttons": [
//                             {
//                                 "type": "postback",
//                                 "title": "Yes!",
//                                 "payload": "yes",
//                             },
//                             {
//                                 "type": "postback",
//                                 "title": "No!",
//                                 "payload": "no",
//                             }
//                         ],
//                     }]
//                 }
//             }
//         }
//
// }
//
// // Sends the response message
//     callSendAPI(sender_psid, response);
// }

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = { "text": "Thanks!" }
    } else if (payload === 'no') {
        response = { "text": "Oops, try sending another image." }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": { "text": response }
    };

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v7.0/me/messages",
        "qs": { "access_token": process.env.FB_PAGE_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!');
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

// function firstTrait(nlp, name) {
//     return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
// }

function firstTrait(nlp, name) {
    return nlp && nlp.entities && nlp.traits[name] && nlp.traits[name][0];
}

function handleMessage(sender_psid, message) {
    //handle message for react, like press like button
    // id like button: sticker_id 369239263222822
 console.log('INTO HANDLE MESSAGE');
     console.log(message);

    let entitiesArr = [ "wit$greetings", "wit$thanks", "wit$bye" ];
    let entityChosen = "";
    const apiUrl = `https://api.searskairos.ai/stream_product_search?data=`+ message.text + `&lang=eng&h=0.7395409690503449`;
    console.log('API URL : ',apiUrl);
     fetch(apiUrl)
        .then(response => {
            // Check if the request was successful (status code 200)
            if (!response.ok) {
             callSendAPI(sender_psid,`Welcome to Sears.` );
            }
            // Parse the JSON response
            return response.json();
        })
        .then(data => {
            // Handle the data from the API response
            console.log('API Response from BOT:', data);
            // You can perform further actions with the data here
             callSendAPI(sender_psid, data.resp );
            callSendAPIWithTemplate(sender_psid);
            callSendAPIWithVideo(sender_psid);
        })
        .catch(error => {
            // Handle errors during the fetch process
            console.error('Error fetching data:', error);
        });
}

let callSendAPIWithTemplate = (sender_psid) => {
    // document fb message template
    // https://developers.facebook.com/docs/messenger-platform/send-messages/templates
    let body = {
        "recipient": {
            "id": sender_psid
        },
        "message": {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [
                        {
                            "title": "Want to buy sth awesome?",
                            "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Sears_Store_Closing_Sale_Westland_Mall_Hialeah_%2849525992311%29.jpg/1280px-Sears_Store_Closing_Sale_Westland_Mall_Hialeah_%2849525992311%29.jpg",
                            //"subtitle": "Watch more videos on my youtube channel ^^",
                            "buttons": [
                                {
                                    "type": "web_url",
                                    "url": "https://www.sears.com/",
                                    "title": "Shop Now"
                                }
                            ]
                        }
                    ]
                }
            }
        }
    };

    request({
        "uri": "https://graph.facebook.com/v6.0/me/messages",
        "qs": { "access_token": process.env.FB_PAGE_TOKEN },
        "method": "POST",
        "json": body
    }, (err, res, body) => {
        if (!err) {
            // console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
};

let callSendAPIWithVideo = (sender_psid) => {
    // Specify the video URL
    let videoUrl = "https://media.istockphoto.com/id/1483601793/video/portrait-of-beautiful-hispanic-woman-enjoying-peaceful-seaside-at-sunset-exploring.mp4?s=mp4-640x640-is&k=20&c=YTRPKaiZqvyIESwPrV0W0SEiXlEBsQW81XaGwPs71iA=";

    // Create the message body with a video attachment
    let body = {
        "recipient": {
            "id": sender_psid
        },
        "message": {
            "attachment": {
                "type": "video",
                "payload": {
                    "url": videoUrl
                }
            }
        }
    };

    request({
        "uri": "https://graph.facebook.com/v6.0/me/messages",
        "qs": { "access_token": process.env.FB_PAGE_TOKEN },
        "method": "POST",
        "json": body
    }, (err, res, body) => {
        if (!err) {
            // console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
 
};


module.exports = {
  postWebhook: postWebhook,
  getWebhook: getWebhook
};
