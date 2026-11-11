const WebSocket = require("ws");
const wsServer = new WebSocket.Server({ port: 9000 });

let clients = [];

const onConnect = (wsClient) => {
    console.log("Новый пользователь подключился");
    clients.push(wsClient);

    wsClient.on("message", (message) => {
        try {
            const jsonMessage = JSON.parse(message.toString());
            clients.filter(c => c !== wsClient)
                .forEach(c => c.send(JSON.stringify(jsonMessage)));
        } catch (error) {
            console.error(error);
        }
    });



    wsClient.on("close", () => {
        clients = clients.filter(c => c !== wsClient);
        console.log("Пользователь отключился");
    });
}

wsServer.on("connection", onConnect);
console.log("server started http://localhost:9000");