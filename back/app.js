var mongoClient = require("mongodb").MongoClient;

var app = require('express')();
var server = app.listen(3000);
var io = require('socket.io').listen(server);
var roomUsers = [];
var url = "mongodb://localhost:27017/chat";

mongoClient.connect(url, (err, db) => {

    const collection = db.db('chat').collection('posts');

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "http://localhost:4200");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader('Access-Control-Allow-Credentials', true);
        next();
    });

    io.of('/api/chat').on('connection', function (socket) {
        console.log('user connected', socket.handshake.address);
        socket.on('chat message', function (msg) {
            if (msg.message.length < 200) {
                collection.insertOne(msg, function (err, result) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log(result.ops);
                    io.of('/api/chat').emit('chat message', msg);
                })
            } else {
                io.of('/api/chat').emit('invalid value', msg);
            }
        });
        socket.on('user entered chat', function (msg) {
            if (/[^A-Za-z0-9]+$/.test(msg)) {
                roomUsers.push(msg);
                console.log(msg, socket.handshake.address);
                io.of('/api/chat').emit('user entered chat', msg);
            } else {
                io.of('/api/chat').emit('invalid value', msg);
            }
        });
        socket.on('user disconnected', function (user) {
            console.log(user);
            console.log(user ? `${user}(${socket.handshake.address})` : socket.handshake.address, 'disconnected');
            user ? roomUsers.splice(roomUsers.indexOf(roomUsers.find((el) => el.name == user)), 1) : null;
            user ? io.of('/api/chat').emit('disconnect', user) : null;
        });
        socket.on('user typing', function (user) {
            io.of('/api/chat').emit('user typing', user);
        });
    });

    app.get("/api/chat/getUsers", function (req, res) {
        res.send(roomUsers);
    });

    app.get("/api/chat/getPosts", function (req, res) {
        collection.find().toArray(function (err, result) {
            if (err) {
                res.send(err);
            }
            console.log(result.ops);
            res.send(result);
        })
    });
});
