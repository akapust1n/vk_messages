const TelegramBot = require('node-telegram-bot-api');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


const token = process.argv[2];
const vkToken = process.argv[3];
const chatId = process.argv[4];

let confMsg = [];

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/checkgroups(.+)/, (msg, match) => {
    //TODO::
    // // 'msg' is the received Message from Telegram
    // // 'match' is the result of executing the regexp above on the text content
    // // of the message

    // const chatId = msg.chat.id;
    // const resp = match[1]; // the captured "whatever"

    // // send back the matched "whatever" to the chat
    // bot.sendMessage(chatId, resp);
});
bot.onText(/\/countgroupsmsg(.+)/, (msg, match) => {
    //TODO
    // const chatId = msg.chat.id;
    // const resp = match[1];

    // bot.sendMessage(chatId, resp);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Received your message');
});

function init() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', "https://api.vk.com/method/messages.getLongPollServer?access_token=" + vkToken + "&lp_version=3&v=5.92", false);
    xhr.send();
    const serverInfo = JSON.parse(xhr.responseText)["response"];
    const longPollKey = serverInfo["key"];
    const longPollServer = serverInfo["server"];
    let ts = serverInfo["ts"];
    const getUpdates = () => {
        let newXhr = new XMLHttpRequest();
        newXhr.open('GET', `https://${longPollServer}?act=a_check&key=${longPollKey}&ts=${ts}&wait=25&mode=2&version=3`, true);
        newXhr.send();
        newXhr.onload = function () {
            const responseLongPoll = JSON.parse(newXhr.responseText);
            ts = responseLongPoll["ts"];
            if (responseLongPoll.updates.length != 0) {
                for (let i = 0; i < responseLongPoll.updates.length; ++i) {
                    // console.log(responseLongPoll.updates[i]);
                    const update = responseLongPoll.updates[i];
                    if (update[0] == 4) {
                        if (update[3] < 2000000000) //check that is user
                        {
                            let userXhr = new XMLHttpRequest();
                            userXhr.open('GET', `https://api.vk.com/method/users.get?access_token=${vkToken}&user_ids=${update[3]}&v=5.92`, false);
                            userXhr.send();
                            const msg = JSON.parse(userXhr.responseText)["response"][0];
                            bot.sendMessage(chatId, `[${msg["first_name"]} ${msg["last_name"]}] \n ${update[5]}`);
                        }
                        else {
                            confMsg.push(update);
                        }
                    }
                }
            }
            getUpdates();
        }
    };
    getUpdates();

}
init();