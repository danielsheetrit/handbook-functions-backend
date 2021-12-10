const serviceAccount = require('./credentials/service-account.json')
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const app = require('express')()

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

//functions import
const { getScreams, addScream } = require('./scream/scream-functions')
const { signup, login } = require('./auth/auth-functions')
const { addUserDetails, getUserDetails } = require('./user/user-functions')

//middlewares
const authMiddleware = require('./auth/authMiddleware')

//crud routes
app.get('/screams', getScreams)
app.post('/scream', authMiddleware, addScream)

//auth routes
app.post('/auth/signup', signup)
app.post('/auth/login', login)

//user routes
// TODO: Upload image functions
app.post('/user', authMiddleware, addUserDetails)
app.get('/user', authMiddleware, getUserDetails)

exports.api =
    functions
        .region('europe-central2')
        .https
        .onRequest(app)