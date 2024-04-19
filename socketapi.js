const io = require( "socket.io" )();
const socketapi = {
    io: io
};

io.on("connection", function(socket) {
    console.log("A user connected");

    socket.on("message", function(message) {
        console.log("Received message:", message);
        
        socket.broadcast.emit("sony", message)
    });
});


module.exports = socketapi;