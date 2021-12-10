const { isEmpty } = require('../validators')

const admin = require('firebase-admin')
const db = admin.firestore()

const getUserDetails = async (req, res) => {

    try {

        const detailsSnapshot =
            await db
                .doc(`/users/${req.user.uid}`)
                .get()

        if (!detailsSnapshot.exists) {
            return res
                .status(404)
                .json({ error: 'User not found/exists' })
        }

        let likesData = []

        const likesSnapshot = await db
            .collection('likes')
            .where('userId', '==', req.user.uid)
            .get()

        likesSnapshot.forEach(doc => likesData.push(doc.data()))

        return res
            .status(200)
            .json({
                likes: likesData,
                userDetails: detailsSnapshot.data()
            })

    } catch (e) {

        return res
            .status(500)
            .json({ error: e.message })
    }
}

const addUserDetails = async (req, res) => {

    const data = req.body
    let userDetails = {}

    if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio

    if (!isEmpty(data.website.trim())) {

        //when the site have http and we try to reach out with https
        //the site will crush, but with http it works either way.

        if (data.website.trim().substring(0, 3) === 'www') {
            userDetails.website = data.website
        } else if (data.website.trim().substring(0, 4) !== 'http') {
            userDetails.website = `http://${data.website.trim()}`
        } else userDetails.website = data.website
    }

    if (!isEmpty(data.location.trim())) {
        userDetails.location = data.location
    }

    try {

        await db
            .doc(`/users/${req.user.uid}`)
            .update(userDetails)

        return res
            .status(200)
            .json({ message: 'Details added successfully' })

    } catch (e) {

        return res
            .status(500)
            .json({ error: e.message })
    }
}

module.exports = {
    addUserDetails,
    getUserDetails
}