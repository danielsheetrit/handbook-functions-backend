const serviceAccount = require('./credentials/service-account.json')
const functions = require('firebase-functions')
const admin = require('firebase-admin')

// const cors = require('cors')
// const corsOptions = {
//     origin:
// }

const app = require('express')()

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

//functions import
const {
    getScreams,
    addScream,
    getScream,
    commentOnScream,
    likeScream,
    unlikeScream,
    removeScream,
    removeComment
} = require('./scream/scream-functions')

const {
    signup,
    login
} = require('./auth/auth-functions')

const {
    addUserDetails,
    getUserDetails
} = require('./user/user-functions')

//middlewares
const authMiddleware = require('./auth/authMiddleware')

//scream routes
app.get('/screams', getScreams)
app.get('/scream/:screamId', getScream)
app.post('/scream', authMiddleware, addScream)
app.delete('/scream/:screamId', authMiddleware, removeScream)

app.post('/scream/:screamId/comment', authMiddleware, commentOnScream)
app.delete('scream/:screamId/comment/:commentId', authMiddleware, removeComment)

app.post('/scream/:screamId/like', authMiddleware, likeScream)
app.delete('/scream/:screamId/unlike', authMiddleware, unlikeScream)

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