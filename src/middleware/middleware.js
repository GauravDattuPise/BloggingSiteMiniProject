//  Authentication

// Add an authorisation implementation for the JWT token that validates the token 
// before every protected endpoint is called. If the validation fails,
//  return a suitable error message with a corresponding HTTP status code
// Protected routes are create a blog, edit a blog, get the list of blogs, delete a blog(s)
// Set the token, once validated, in the request - x-api-key
// Use a middleware for authentication purpose.

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')


const blogModel = require('../models/blogModel');

const authentication = async function (req, res, next) {

    try {
        // getting token from headers
        const token = req.headers['x-api-key'];

        if (!token) {
            return res.status(400).send({ status: false, message: "Token is mandatory" });
        }
        // veryfying token using by checking token with secret-key
        jwt.verify(token, process.env.SECRETKEY, (err, decodedToken) => {

            if (err) {
                return res.status(400).send({ status: false, message: err.message })
            }

            // setting userId in headers
            req.headers['loggedUser'] = decodedToken.user

            next();
        })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//====================================================================================

// Authorisation
// Make sure that only the owner of the blogs is able to edit or delete the blog.
// In case of unauthorized access return an appropirate error message.



const authorisation = async function (req, res, next) {

    try {
        // getting userId from headers
        let loggedUser = req.headers["loggedUser"]
        if (!loggedUser) {
            return res.status(404).send({ status: false, message: "logged user not found" });
        }

        // if authorId is given in req.params
        if (Object.keys(req.params).length != 0) {
            const blogId = req.params.blogId
            if (!mongoose.isValidObjectId(blogId)) {
                return res.status(400).send({ status: false, message: "Provided format of blogId in param is invalid" })
            }

            // checking blog is exists or not
            const findBlogAuthor = await blogModel.findOne({ _id: blogId })
            if (!findBlogAuthor) {
                return res.status(404).send({ status: false, message: "blog not found" });
            }

            // getting author from blog document
            const getAuthor = findBlogAuthor.authorId
            if (getAuthor != loggedUser) {
                return res.status(403).send({ status: false, message: "You are not authorized" })
            }
        }

        // if authorId is given in query param
        if (req.query.authorId) {
            if (req.query.authorId != loggedUser) {
                return res.status(403).send({ status: false, message: "You are not authorized (q)" })
            }
        }

         // checking token's userID and authorId matching or not
         if (req.body.authorId) {
             if (req.body.authorId !== loggedUser) {
                 return res.status(403).send({ status: false, message: "authorID and token's authorID not matching" })
             }
         }

        next();
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { authentication, authorisation }