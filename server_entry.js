var net = require('net')
const decoder = require('./Decoder')

var server = net.createServer(socket => {
    socket.write('Echo server\r\n')

    socket.on('end', () => {
        console.log('client disconnected')
    })

    socket.on('data', data => {
        var decoded = decoder.b64EncodeUnicode(data)
        var json_data = JSON.parse(decoded)

        console.log(json_data.action)
        console.log(json_data.username)
        console.log(json_data.password)
        console.log(json_data.re_password)
    })

    socket.pipe(socket)
})

server.listen(1337, '127.0.0.1')