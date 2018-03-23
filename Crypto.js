const atob = require('atob')
const btoa = require('btoa')

var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';

exports.decoder = str => {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

exports.encoder = str => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode('0x' + p1)
    }))
}

exports.decrypt = val => {
    var decipher = crypto.createDecipher(algorithm, password)
    var dec = decipher.update(val, 'hex', 'utf8')
    dec += decipher.final('utf8')

    return dec
}

exports.encrypt = val => {
    var cipher = crypto.createCipher(algorithm, password)
    var crypted = cipher.update(val, 'utf8', 'hex')
    crypted += cipher.final('hex')

    return crypted
}