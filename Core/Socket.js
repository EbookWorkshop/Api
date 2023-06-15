const socketIO = require('socket.io');

let myIO = null;

class SocketIO {
    constructor(server) {
        if (myIO != null) return myIO;
        myIO = socketIO(server,{
            cors: {
              origin: '*',
              methods: ['GET', 'POST'],
            //   allowedHeaders: ['my-custom-header'],
              credentials: true
            }
          });

        myIO.on("connection", (socket) => {
            console.log("客户端已上线");

            socket.on("message", (msg) => {
                console.log("收到消息：", msg);
            })
        });


    }

    static GetIO() {
        console.assert(myIO !== null, "需要先初始化好Socket服务才能取得对应实例！");//
        return myIO;
    }
}

module.exports = SocketIO; 