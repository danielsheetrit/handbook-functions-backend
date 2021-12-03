const serviceAccount = require('./credentials/service-account.json');

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const authMiddleware = require('./auth/authMiddleware')

const { getScreams, addScream } = require('./scream/scream-functions')
const { signup, login } = require('./auth/auth-functions')

//crud routes
app.get('/screams', getScreams)
app.post('/scream', authMiddleware, addScream)

//auth routes
app.post('/signup', signup)
app.post('/login', login)

exports.api =
    functions
        .region('europe-central2')
        .https
        .onRequest(app);