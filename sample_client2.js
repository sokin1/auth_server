import encoder from './Encoder'
const net = require('net')
const md5 = require('md5')

var client = new net.Socket()
client.connect(1337, '127.0.0.1', () => {
    // const jsonData = {
    //     action: 'SIGN_UP',
    //     username: 'sokis1986@gmail.com',
    //     password: md5(encoder('password2')),
    //     re_password: md5(encoder('password2'))
    // }

    const jsonData = {
        action: 'VALIDATE'
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