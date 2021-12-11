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
                .orderBy('createdAt', 'desc')
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

const commentOnScream = async (req, res) => {

    if (isEmpty(req.body.body)) {
        return res
            .status(400)
            .json({ error: 'Must not be empty' })
    }

    const comment = {
        body: req.body.body,
        createdAt: Date.now(),
        screamId: req.params.screamId,
        username: req.body.username,
        userId: req.body.userId
        //TODO: Add imageUrl
    }

    try {

        const screamRef = db.doc(`/screams/${req.params.screamId}`)

        const screamSnapshot = await screamRef.get()

        if (!screamSnapshot.exists) {
            return res
                .status(404)
                .json({ error: 'Scream not found' })
        }

        await db
            .collection('comments')
            .add(comment)

        await screamRef.update({
            commentCount: screamSnapshot.data().commentCount ?
                screamSnapshot.data().commentCount + 1 : 1
        })

        return res
            .status(201)
            .json({
                message: 'Comment added successfully',
                comment
            })

    } catch (e) {

        console.error(e.code)
        return res
            .status(500)
            .json({ error: e.message })
    }
}

const likeScream = async (req, res) => {

    try {
        //creating references
        const screamRef = db.doc(`/screams/${req.params.screamId}`)
        const likeRef = db.collection('likes')

        //Check if the Scream exists.
        const screamSnapshot =
            await screamRef
                .get()

        if (!screamSnapshot.exists) {
            return res
                .status(404)
                .json({ error: 'Scream not found' })
        }

        // Check if the user already like the scream.
        const likeSnapshot =
            await likeRef
                .where('userId', '==', req.user.uid)
                .where('screamId', '==', req.params.screamId)
                .get()

        if (likeSnapshot.size) {
            return res
                .status(400)
                .json({ error: 'Scream liked already' })
        }

        const userDetails =
            await db
                .doc(`/users/${req.user.uid}`)
                .get()

        await likeRef.add({
            screamId: req.params.screamId,
            userId: req.user.uid,
            username: userDetails.data().username
        })

        await screamRef.update({
            likeCount: screamSnapshot.data().likeCount ?
                screamSnapshot.data().likeCount + 1 : 1
        })

        return res
            .status(200)
            .json({ message: 'Like added successfully' })

    } catch (e) {

        console.error(e.code)
        return res
            .status(500)
            .json({ error: e.message })
    }
}

module.exports = {
    getScreams,
    addScream,
    getScream,
    commentOnScream,
    likeScream
}