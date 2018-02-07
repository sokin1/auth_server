const net = require('net')
const Crypto = require('./Crypto.js')
const firebase = require('firebase')

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
        var json_data = JSON.parse(Crypto.decoder(data))
        console.log('received', json_data)

        if(json_data.action === 'SIGN_UP') {
            console.log(JSON.stringify(json_data))
            if(!checkPasswordValidity(json_data.password, json_data.confirm_password)) {
                socket.write(JSON.stringify({
                    Action: 'SIGN_UP',
                    Result: false,
                    Reason: 'Password is not matched with confirm_password'
                }))
            } else {
                firebase.auth().createUserWithEmailAndPassword(json_data.email, json_data.password)
                .then(userRecord => {
                    firebase.database().ref('users/').set({
                        uname: '',
                        email: userRecord.email,
                        emailVerified: userRecord.emailVerified,
                        createdAt: (new Date()).getMilliseconds().toString(),
                        lastLogIn: undefined,
                        gid: [],
                        lastGroup: undefined,
                    }).then(() => {
                        userRecord.sendEmailVerification()
                        .then(() => {
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
                    socket.write(JSON.stringify({
                        Action: 'SIGN_UP',
                        Result: false,
                        Reason: e
                    }))
                })
            }
        } else if(json_data.action == 'LOG_IN') {
            defaultApp.auth().signInWithEmailAndPassword(json_data.email, json_data.password)
            .then(user => {
                console.log(user)
                firebase.database().ref('users/' + json_data.email).set({
                    logged_in: true
                })
                .then(onResolve => {
                    var resp_data = {
                        email: user.email,
                        name: user.displayName,
                        photoUrl: user.photoURL,
                        email_verified: user.emailVerified
                    }
    
                    socket.write(JSON.stringify(resp_data))
                })
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