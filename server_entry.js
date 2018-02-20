const net = require('net')
const Crypto = require('./Crypto.js')
const firebase = require('firebase')
const md5 = require('md5')

var config = {
    apiKey: "AIzaSyAp9WiJPvArikLgXJQmJg5Kn7OJ2hoDv60",
    authDomain: "userinfo-7f8f9.firebaseapp.com",
    databaseURL: "https://userinfo-7f8f9.firebaseio.com",
    projectId: "userinfo-7f8f9",
    storageBucket: "userinfo-7f8f9.appspot.com",
    messagingSenderId: "914637440469"
};

firebase.initializeApp(config);

var UUID = require('uuid/v1')

var server = net.createServer(socket => {
    socket.on('end', () => {
        console.log('client disconnected')
    })

    socket.on('data', data => {
        function checkPasswordValidity(psw, psw_re) {
            return psw === psw_re
        }

        var json_data = JSON.parse(Crypto.decoder(data))
        console.log('received', json_data)

        if(json_data.action === 'SIGN_UP') {
            if(!checkPasswordValidity(json_data.password, json_data.confirm_password)) {
                socket.write(JSON.stringify({
                    Action: 'SIGN_UP',
                    Result: false,
                    Reason: 'Password is not matched with confirm_password'
                }))
            } else {
                firebase.auth().createUserWithEmailAndPassword(json_data.email, json_data.password)
                .then(userRecord => {
                    console.log('userRecord On Sign Up', userRecord)
                    firebase.database().ref('users/' + md5(json_data.email)).set({
                        email: userRecord.email,
                        emailVerified: 'Not Sent',
                        createdAt: userRecord.metadata.creationTime,
                        lastLogIn: userRecord.metadata.lastSignInTime,
                        gid: [],
                        lastGroup: '',
                    }).then(() => {
                        userRecord.sendEmailVerification()
                        .then(() => {
                            firebase.database().ref('users/' + md5(json_data.email)).update({
                                emailVerified: 'Sent'
                            })

                            socket.write(JSON.stringify({
                                Action: 'SIGN_UP',
                                Result: true,
                                MetaData: userRecord.metadata
                            }))
                        })
                        .catch(e => {
                            socket.write(JSON.stringify({
                                Action: 'SIGN_UP',
                                Result: false,
                                Reason: 'Sending email verification failed'
                            }))
                        })
                    })
                })
                .catch(e => {
                    console.log(e)
                    socket.write(JSON.stringify({
                        Action: 'SIGN_UP',
                        Result: false,
                        Reason: e.message
                    }))
                })
            }
        } else if(json_data.action == 'LOG_IN') {
            firebase.auth().signInWithEmailAndPassword(json_data.email, json_data.password)
            .then(user => {
                if(!user.emailVerified) {
                    socket.write(JSON.stringify({
                        Action: 'LOG_IN',
                        Result: false,
                        Reason: 'Email Not Verified'
                    }))
                } else {
                    firebase.database().ref('users/' + md5(json_data.email)).update({
                        logged_in: true,
                        lastLogIn: user.metadata.lastSignInTime,
                        emailVerified: 'Verified'
                    })
                    .then(onResolve => {
                        firebase.database().ref('users/' + md5(json_data.email)).once('value').then(user => {
                            console.log('user After Log In', user.val())
                            var resp_data = {
                                email: user.email,
                                gid: user.gid,
                                lastGroup: user.lastGroup
                            }
            
                            socket.write(JSON.stringify(resp_data))
                        })

                        ref = firebase.database().ref('users/' + md5(json_data.email))
                    })
                }
            })
            .catch(e => {
                var errorCode = e.code
                var errorMessage = e.message

                console.log(errorCode, errorMessage)
            })
        } else if(json_data.Action == 'VALIDATE') {
            var user = firebase.auth().currentUser
            socket.write(JSON.stringify(user))
        }
    })
})

server.listen(1337, '127.0.0.1')