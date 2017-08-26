const btoa = require('btoa')

export default function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode('0x' + p1)
    }))
}