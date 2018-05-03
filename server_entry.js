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
                    firebase.database().ref('users/' + md5(json_data.email)).set({
                        email: userRecord.email,
                        emailVerified: 'Not Sent',
                        createdAt: userRecord.metadata.creationTime,
                        lastLogIn: userRecord.metadata.lastSignInTime,
                        gid: [],
                        lastGroup: '',
                    }).then(onResolve => {
                        userRecord.sendEmailVerification()
                        .then(() => {
                            firebase.database().ref('users/' + md5(json_data.email)).update({
                                emailVerified: 'Sent'
                            }).then(() => {
                                socket.write(JSON.stringify({
                                    Action: 'SIGN_UP',
                                    Result: true
                                }))
                            })
                        })
                        .catch(e => {
                            socket.write(JSON.stringify({
                                Action: 'SIGN_UP',
                                Result: false,
                                Reason: 'Sending email verification failed'
                            }))
                        })
                    }).catch(reason => {
                        console.log('fail', reason)
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
        } else if(json_data.action === 'LOG_IN') {
            console.log(json_data.email, json_data.password)
            firebase.auth().signInWithEmailAndPassword(json_data.email, json_data.password)
            .then(user => {
                if(!user.emailVerified) {
                    socket.write(JSON.stringify({
                        Action: 'LOG_IN',
                        Result: false,
                        Reason: 'Email Not Verified'
                    }))
                } else {
                    console.log('metadata: ', user.metadata)
                    console.log('uid: ', user.uid)
                    firebase.database().ref('users/' + md5(json_data.email)).update({
                        logged_in: true,
                        emailVerified: 'Verified',
                        lastLogIn: user.metadata.lastSignInTime
                    })
                    .then(onResolve => {
                        var resp_data = {
                            Action: 'LOG_IN',
                            Result: true,
                            Detail: {
                                accCredential: Crypto.encrypt(json_data.email + '|' + json_data.password),
                                fb_config: config
                            }
                        }
                        console.log('logged in...')
        
                        socket.write(JSON.stringify(resp_data))
                    })
                }
            })
            .catch(e => {
                var errorCode = e.code
                var errorMessage = e.message

                console.log(errorCode, errorMessage)
            })
        } else if(json_data.Action === 'LOG_IN_WITH_CREDENTIAL') {
            var credential = json_data.credential
            var decryptedCredential = Crypto.decrypt(credential)
            var usernamePassword = decryptedCredential.split('|')

            firebase.auth().signInWithEmailAndPassword(usernamePassword[0], usernamePassword[1])
            .then(user => {
                console.log('metadata: ', user.metadata)
                console.log('uid: ', user.uid)
                firebase.database().ref('users/' + md5(usernamePassword[0])).update({
                    logged_in: true,
                    emailVerified: 'Verified',
                    lastLogIn: user.metadata.lastSignInTime
                })
                .then(onResolve => {
                    var resp_data = {
                        Action: 'LOG_IN',
                        Result: true
                    }
                    console.log('logged in...')
    
                    socket.write(JSON.stringify(resp_data))
                })
            })
            .catch(e => {
                var errorCode = e.code
                var errorMessage = e.message

                console.log(errorCode, errorMessage)
            })

        } else if(json_data.Action === 'VALIDATE') {
            var user = firebase.auth().currentUser
            socket.write(JSON.stringify(user))
        }
    })
})

server.listen(1337, '127.0.0.1')