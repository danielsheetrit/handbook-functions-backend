const { isEmpty } = require('../validators')

const admin = require('firebase-admin')
const db = admin.firestore()

const getScreams = async (req, res) => {

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

        return res
            .status(200)
            .json(screams)

    } catch (e) {

        return res
            .status(500)
            .json({ error: e.message })
    }
}

const getScream = async (req, res) => {

    try {

        const screamSnapshot =
            await db
                .doc(`/screams/${req.params.screamId}`)
                .get()

        if (!screamSnapshot.exists) {
            return res
                .status(404)
                .json({ error: 'Scream not found' })
        }

        const commentsSnapshot =
            await db
                .collection('comments')
                .where('screamId', '==', req.params.screamId)
                .get()

        let comments = []
        commentsSnapshot.forEach(doc => comments.push(doc.data()))

        return res
            .status(200)
            .json({
                comments,
                screamId: screamSnapshot.id,
                scream: screamSnapshot.data()
            })

    } catch (e) {
        return res
            .status(500)
            .json({ error: e.message })
    }
}

const addScream = async (req, res) => {

    if (isEmpty(req.body.body)) {
        return res
            .status(400)
            .json({ error: 'Must not be empty' })
    }

    try {

        await db
            .collection('screams')
            .add({
                body: req.body.body,
                username: req.body.username,
                createdAt: Date.now()
            })

        return res
            .status(200)
            .json({ message: 'Scream added successfully' })

    } catch (e) {

        return res
            .status(500)
            .json({ error: e.message })
    }
}

module.exports = {
    getScreams,
    addScream,
    getScream
}