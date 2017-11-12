import encoder from './Encoder'
const net = require('net')
const md5 = require('md5')

var client = new net.Socket()
client.connect(1337, '127.0.0.1', () => {
    // const jsonData = {
    //     action: 'SIGN_UP',
    //     username: 'sokin1@hotmail.com',
    //     password: md5(encoder('password')),
    //     re_password: md5(encoder('password'))
    // }

    const jsonData = {
        action: 'SIGN_UP_P1',
        username: 'sokin1@hotmail.com',
        password: md5(encoder('password'))
    }

    // write will encode data before send it to server
    client.write(JSON.stringify(jsonData))
})

client.on('data', data => {
    console.log('data', JSON.parse(data))
    // const jsonData = {
    //     action: 'LOG_IN',
    //     username: 'sokin1@hotmail.com',
    //     password: md5(encoder('password'))
    // }

    // client.write(JSON.stringify(jsonData))
})

client.on('close', () => {
    console.log('Connection closed')
})