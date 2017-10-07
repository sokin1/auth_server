var net = require('net')
import decoder from './Decoder'

var admin = require('firebase-admin')
var serviceAccount = require('./resource/userinfo-7f8f9-firebase-adminsdk-ophcs-42fb689ca1.json')

var defaultApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://userinfo-7f8f9.firebaseio.com"
})

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
            defaultApp.auth().createUser({
                email: json_data.email,
                emailVerified: false,
                phoneNumber: "",
                password: json_data.password,
                displayName: "",
                photoURL: "",
                disabled: false
            })
            .then(userRecord => {
                userRecord.sendEmailVerification()
                .then(() => {
                    
                })
                .catch(e => {
                    console.error(e)
                })
            })
            .catch(e => {
                console.error(e)
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