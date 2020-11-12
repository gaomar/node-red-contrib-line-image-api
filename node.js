module.exports = (RED) => {
    'use strict';
    
    const axiosBase = require('axios');
    const Mustache = require('mustache');

    const main = function(config) {
        const node = this;
        RED.nodes.createNode(node, config);

        let output = config.output;

        const LINE_TOKEN = config.AccessToken;
        const axios = axiosBase.create({
            baseURL: `https://api.line.me/v2/bot/message`,
            headers: {
                'Authorization': `Bearer ${LINE_TOKEN}`
            }
        });

        //メインの処理
        const handleEvent = async (event, msg) => {
            let targetMessageId = Mustache.render(config.MessageId, msg);

            if (targetMessageId.length == 0) {
                targetMessageId = event.message.id;
            }

            try {
                const res = await axios.get(`/${targetMessageId}/content`, {
                    responseType: "arraybuffer"
                  });
                
                if (output === 'binary') {
                    return Promise.resolve(Buffer.from(res.data));
                } else {
                    return Promise.resolve(Buffer.from(res.data).toString('base64'));
                }
            } catch (error) {
                console.log(error);
                return Promise.resolve(null);
            }
        }

        node.on('input', async (msg) => {
            Promise
                .all(msg.payload.events.map(handleEvent, msg))
                .then(result => {
                    msg.payload = result[0];
                    node.send(msg)
                }).catch(err => {
                    console.log(err);
                    node.error(err);
                });
        });
    }

    RED.nodes.registerType("line-image", main);
}