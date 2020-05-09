const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const router = require('./router');
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");
const cors = require('cors')

const PORT = process.env.PORT || 5000

const app = express();
const server = http.createServer(app);
const io = socketio(server)
app.use(router)
app.use(cors)

io.on('connect', (socket) => {

    socket.on('join', ({ name, room }, callback) => {
        console.log("User has joined the chat")
        let id = socket.id
        const { error, user } = addUser({ id, name, room })

        if (error)
            return callback(error)

        socket.emit('message', { user: 'admin', text: `${user.name},welcome to ${user.room}` })
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined the room` })

        socket.join(user.room)

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', { user: user.name, text: message })
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left the room` })
        }
    })
})


server.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`)
})
