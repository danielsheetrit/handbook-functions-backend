const webApiCredential = require('../credentials/web-key-credential.json');
const { isEmail, isEmpty } = require('../validators');

const axios = require('axios');
const admin = require('firebase-admin');
const db = admin.firestore();

const signup = async (req, res) => {

    let userToAdd = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        username: req.body.username
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

    if (isEmpty(userToAdd.username)) errors.username = 'Must not be empty.'

    if (Object.keys(errors).length !== 0) {
        return res.status(400).json(errors)
    }

    try {
        //cheking if username is already in use
        const userRecord =
            await db
                .collection('users')
                .where('username', '==', userToAdd.username)
                .get()

        if (!userRecord.empty) {
            return res.status(403).json({ message: 'username already in use' })
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
            .doc(userToAdd.userId)
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
}

const login = async (req, res) => {

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

    //this property make the *idToken* readable, if its false
    //it won't pass the middleware, because it expects --scure token only--
    userToAuth.returnSecureToken = true

    try {

        const authResult = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${webApiCredential.key}`, userToAuth)

        const token = authResult.data.idToken

        return res.status(200).json({ token })

    } catch (e) {

        if (e.message === 'Request failed with status code 400') {
            return res.status(403).json({ message: 'Worng email or password.' })
        }
        return res.status(500).json({ message: e.message })
    }
}

module.exports = {
    signup,
    login
}