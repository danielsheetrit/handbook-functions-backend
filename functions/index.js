const { isEmail, isEmpty } = require('./util');
const serviceAccount = require('./service-account.json');
const webApiCredential = require('./web-key-credential.json');

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

const axios = require('axios');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.get('/screams', async (req, res) => {

    try {
        const snapshot =
            await db
                .collection('screams')
                .orderBy('createdAt', 'desc')
                .get()

        let screams = []
        snapshot.forEach(doc => screams.push({
            id: doc.id,
            ...doc.data()
        }))

        return res.status(200).json(screams)
    } catch (e) {
        return res.status(500).json({ message: e.message })
    }
})

app.post('/scream', async (req, res) => {

    const screamToAdd = {
        body: req.body.body,
        userName: req.body.userName,
        createdAt: Date.now()
    }

    try {
        const snapshot =
            await db
                .collection('screams')
                .add(screamToAdd)

        return res
            .status(200)
            .json({ message: `Scream (id: ${snapshot.id}) added successfully` })
    } catch (e) {
        return res
            .status(500)
            .send({ message: e.message })
    }
})

//auth routes
app.post('/signup', async (req, res) => {

    let userToAdd = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        userName: req.body.userName
    };

    //Data validation
    let errors = {};

    if (isEmpty(userToAdd.email)) errors.email = 'Must not be empty.'
    else if (!isEmail(userToAdd.email)) {
        errors.email = 'Must be a valid email adress.'
    }

    if (isEmpty(userToAdd.password)) errors.password = 'Must not be empty.'
    else if (userToAdd.password !== userToAdd.confirmPassword) {
        errors.confirmPassword = 'Passwords must match.'
    }

    if (isEmpty(userToAdd.userName)) errors.userName = 'Must not be empty.'

    if (Object.keys(errors).length !== 0) {
        return res.status(400).json(errors)
    }

    try {
        //cheking if username is already in use
        const userRecord =
            await db
                .collection('users')
                .where('userName', '==', userToAdd.userName)
                .get()

        if (!userRecord.empty) {
            return res.status(403).json({ message: 'Username already in use' })
        }

        //creating new user
        const snapshot = await admin.auth().createUser({
            email: userToAdd.email,
            password: userToAdd.password
        })

        //getting id token
        const token =
            await admin
                .auth()
                .createCustomToken(snapshot.uid)

        //Adding user to Database
        userToAdd.userId = snapshot.uid
        userToAdd.createdAt = Date.now()
        await db
            .collection('users')
            .doc()
            .set(userToAdd)

        //sending token back to client 
        return res.status(201).json({ token })
    } catch (e) {
        if (e.code === 'auth/email-already-exists') {
            return res.status(403).json({ message: 'Email already in use' })
        } else {
            return res.status(500).json({ message: e.message })
        }
    }
})

app.post('/login', async (req, res) => {

    const userToAuth = {
        email: req.body.email,
        password: req.body.password
    }

    let errors = {}

    if (isEmpty(userToAuth.email)) errors.email = 'Must not be empty.'
    if (isEmpty(userToAuth.password)) errors.password = 'Must not be empty.'

    if (Object.keys(errors).length !== 0) {
        return res.status(400).json(errors)
    }

    try {
        const authResult = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${webApiCredential.key}`, userToAuth)

        const token = authResult.data.idToken

        return res.status(200).json({ token })
    } catch (e) {
        return res.status(500).json({ message: e.message })
    }
})

exports.api =
    functions
        .region('europe-central2')
        .https
        .onRequest(app);