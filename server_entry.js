var net = require('net')
import decoder from './Decoder'

var firebase = require('firebase')

var config = {
    apiKey: "AIzaSyAp9WiJPvArikLgXJQmJg5Kn7OJ2hoDv60",
    authDomain: "userinfo-7f8f9.firebaseapp.com",
    databaseURL: "https://userinfo-7f8f9.firebaseio.com",
    projectId: "userinfo-7f8f9",
    storageBucket: "userinfo-7f8f9.appspot.com",
    messagingSenderId: "914637440469"
}
firebase.initializeApp(config)

var UUID = require('uuid/v1')

function connect_to_db() {
    // Connect to user-db
}

var server = net.createServer(socket => {
    socket.on('end', () => {
        console.log('client disconnected')
    })

    socket.on('data', data => {
        var json_data = JSON.parse(decoder(data))

        if(json_data.action == 'SIGN_UP') {
            firebase.auth().createUserWithEmailAndPassword(json_data.username, json_data.password)
            .then(user => {
                console.log('email', user.email)
                console.log('name', user.displayName)
                console.log('photoUrl', user.photoURL)
                console.log('verified', user.emailVerified)
                user.sendEmailVerification()
                .then(() => {
                    var resp_data = {
                        email: user.email,
                        name: user.displayName,
                        photoUrl: user.photoURL,
                        email_verified: user.emailVerified
                    }
                    socket.write(JSON.stringify(resp_data))
                })
                .catch(e => {
                    console.error(e)
                })
            })
            .catch(e => {
                var errorCode = e.error
                var errorMessage = e.message

                console.log(errorCode, errorMessage)
            })
        } else if(json_data.action == 'LOG_IN') {
            firebase.auth().signInWithEmailAndPassword(json_data.username, json_data.password)
            .then(user => {
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
        } else if(json_data.action == 'LOG_OUT') {
            firebase.auth().signOut().then(onResolve => {

            })
        } else if(json_data.action == 'VALIDATE') {
            var user = firebase.auth().currentUser
            socket.write(JSON.stringify(user))
        }
    })
})

server.listen(1337, '127.0.0.1')