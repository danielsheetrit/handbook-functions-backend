const serviceAccount = require('./service-account.json')
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

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

        return res.status(200).send(screams)

    } catch (e) {

        return res.status(500).send(e.message)
    }
})

app.post('/scream', async (req, res) => {

    const screamToAdd = {
        body: req.body.body,
        userName: req.body.userName,
        createdAt: Date.now()
    };

    try {

        const snapshot =
            await db
                .collection('screams')
                .add(screamToAdd)

        return res.status(200).send(`Scream (id: ${snapshot.id}) added successfully`)

    } catch (e) {

        return res.status(500).send(e.message)
    }
})

//signup route

app.post('/signup', async (req, res) => {

    const userToAdd = {
        email: req.body.email,
        password: req.body.password,
        userName: req.body.userName,
        createdAt: Date.now()
    }

    //TODO validate data

    try {

        const userRecord =
            await db
                .collection('users')
                .where('userName', '==', userToAdd.userName)
                .get()

        if (!userRecord.empty) {
            return res.status(403).send('Username already in use')
        }

        const snapshotAuth = await admin.auth().createUser({
            email: userToAdd.email,
            password: userToAdd.password
        })

        const token =
            await admin
                .auth()
                .createCustomToken(snapshotAuth.uid)

        return res.status(201).json({
            message: `User (id:${snapshotAuth.uid}) added successfully`,
            token: token
        })

    } catch (e) {

        if (e.code === 'auth/email-already-exists') {
            return res.status(403).send('Email already in use')
        } else {
            return res.status(500).send(e.message)
        }
    }
})

exports.api =
    functions
        .region('europe-central2')
        .https
        .onRequest(app)