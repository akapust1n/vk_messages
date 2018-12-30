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
bot.onText(/\/countgroupsmsg/, (msg, match) => {
    let xhr = new XMLHttpRequest();
    console.log("sss");
    xhr.open('GET', "https://api.vk.com/method/messages.getConversations?access_token=" + vkToken + "&filter=unread&v=5.92", true);
    //xhr.open('GET', "https://api.vk.com/method/messages.getConversations?access_token=" + vkToken + "&filter=all&v=5.92", true);

    xhr.send();
    xhr.onload = () => {
        const response = JSON.parse(xhr.responseText)["response"];
        const dialogs = response["items"];
        let unreadCountGeneral = 0;
        if (dialogs) {
            for (let i = 0; i < dialogs.length && i < 10; ++i) {
                const conversation = dialogs[i]["conversation"];
                if (conversation) {
                    const peer = conversation["peer"];
                    if (peer.type == "chat") {
                        const chatSettings = conversation["chat_settings"];
                        console.log("this is chat");
                        if (chatSettings) {
                            let unreadCount = conversation["unread_count"];
                            ++unreadCountGeneral;
                            bot.sendMessage(msg.chat.id, `[${chatSettings["title"]}]\nUnread_count: ${unreadCount}`);
                        }
                    }
                }
            }

        }
        if (!unreadCountGeneral) {
            bot.sendMessage(msg.chat.id, `Cant find unread chats`);
        }

    }
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
        console.log("call getUpdates");
        let newXhr = new XMLHttpRequest();
        newXhr.open('GET', `https://${longPollServer}?act=a_check&key=${longPollKey}&ts=${ts}&wait=25&mode=2&version=3`, true);
        newXhr.timeout = 900000;
        newXhr.send();
        newXhr.onload = () => {
            const responseLongPoll = JSON.parse(newXhr.responseText);
            console.log("onload", newXhr.responseText);
            ts = responseLongPoll["ts"];
            if (responseLongPoll.updates != undefined && responseLongPoll.updates.length != 0) {
                for (let i = 0; i < responseLongPoll.updates.length; ++i) {
                    // console.log(responseLongPoll.updates[i]);
                    const update = responseLongPoll.updates[i];
                    if (update[0] == 4) {
                        if (update[3] < 2000000000) //check that is user
                        {
                            let userXhr = new XMLHttpRequest();
                            userXhr.open('GET', `https://api.vk.com/method/users.get?access_token=${vkToken}&user_ids=${update[3]}&v=5.92`, true);
                            userXhr.send();
                            userXhr.onload = () => {
                                const msg = JSON.parse(userXhr.responseText)["response"][0];
                                bot.sendMessage(chatId, `[${msg["first_name"]} ${msg["last_name"]}] \n ${update[5]}`);
                            }
                        }
                    }
                }
            }
            getUpdates();
        }
        newXhr.ontimeout = () => {
            console.log("ontimeout", newXhr.responseText);
            getUpdates();
        }
    };
    getUpdates();

}
init();