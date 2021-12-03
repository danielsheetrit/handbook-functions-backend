const admin = require('firebase-admin');
const db = admin.firestore();

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

        return res.status(200).json(screams)
    } catch (e) {
        return res.status(500).json({ message: e.message })
    }
}

const addScream = async (req, res) => {

    const screamToAdd = {
        body: req.body.body,
        username: req.body.username,
    }

    try {

        screamToAdd.createdAt = Date.now()
        
        const snapshot =
            await db
                .collection('screams')
                .add(screamToAdd)

        return res
            .status(200)
            .json({ id: snapshot.id })
    } catch (e) {
        return res
            .status(500)
            .send({ message: e.message })
    }
}

module.exports = {
    getScreams,
    addScream
}