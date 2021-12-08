const { isEmpty } = require('../validators')

const admin = require('firebase-admin')
const db = admin.firestore()

const addUserDetails = async (req, res) => {

    const data = req.body
    let userDetails = {}

    if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;

    if (!isEmpty(data.website.trim())) {
        //when the site have http and we try to reach out with https
        //the site will crush, but with http it works either way.
        if (data.website.trim().substring(0, 4) !== 'http') {
            userDetails.website = `http://${data.website.trim()}`
        } else userDetails.website = data.website
    }

    if (!isEmpty(data.location.trim())) userDetails.location = data.location;

    try {

        await db
            .doc(`/users/${req.user.uid}`)
            .update(userDetails)

        return res.status(200).json({ message: 'Details added successfully' })

    } catch (e) {
        return res.status(500).json({ message: e.message })
    }
}

module.exports = {
    addUserDetails
}