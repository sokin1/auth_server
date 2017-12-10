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

function connect_to_db() {
    // Connect to user-db
}

var server = net.createServer(socket => {
    socket.on('end', () => {
        console.log('client disconnected')
    })

    socket.on('data', data => {
        var json_data = JSON.parse(Crypto.decoder(data))
        console.log('received', json_data)

        if(json_data.action === 'SIGN_UP_P1') {
            console.log(JSON.stringify(json_data))
            firebase.auth().createUserWithEmailAndPassword(json_data.username, json_data.password)
            .then(userRecord => {
                firebase.database().ref('users/').set({
                    email: userRecord.email,
                    emailVerified: userRecord.emailVerified,
                    gid: []
                }).then(() => {
                    userRecord.sendEmailVerification()
                    .then(() => {
                        socket.write(JSON.stringify({
                            Action: 'SIGN_UP_P1',
                            Result: true
                        }))
                    })
                    .catch(e => {
                        socket.write(JSON.stringify({
                            Action: 'SIGN_UP_P1',
                            Result: false,
                            Cause: 'Sending email verification failed'
                        }))
                    })
                })
            })
            .catch(e => {
                socket.write(JSON.stringify({
                    Action: 'SIGN_UP_P1',
                    Result: false,
                    Cause: e
                }))
            })
        } else if(json_data.action == 'SIGN_UP_P2') {
            firebase.auth().currentUser.displayName = json_data.displayName
            firebase.auth().currentUser.phoneNumber = json_data.phoneNumber
            firebase.auth().currentUser.photoURL = json_data.photoURL
        } else if(json_data.action == 'LOG_IN') {
            defaultApp.auth().signInWithEmailAndPassword(json_data.username, json_data.password)
            .then(user => {
                console.log(user)
                firebase.database().ref('users/sokin1').set({
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
        } else if(json_data.Action == 'LOG_OUT') {
            defaultApp.auth().signOut().then(onResolve => {

            })
        } else if(json_data.Action == 'VALIDATE') {
            var user = firebase.auth().currentUser
            socket.write(JSON.stringify(user))
        }
    })
})

server.listen(1337, '127.0.0.1')