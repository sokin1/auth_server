const encoder = require('./Encoder')
const net = require('net')
const md5 = require('md5')

var client = new net.Socket()
client.connect(1337, '127.0.0.1', () => {
    console.log('Connected')
    const jsonData = {
        action: 'SIGN_UP',
        username: 'username',
        password: md5(encoder.b64DecodeUnicode('password')),
        re_password: md5(encoder.b64DecodeUnicode('password'))
    }

    client.write(encoder.b64DecodeUnicode(JSON.stringify(jsonData)))
})

client.on('data', data => {
    console.log('Received: ' + data)
    // client.destroy()
})

client.on('close', () => {
    console.log('Connection closed')
})