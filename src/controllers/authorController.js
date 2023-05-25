
const jwt = require('jsonwebtoken')
const authorModel = require('../models/authorModel');
const validtion = require('../validation/validation')

const createAuthor = async (req, res) => {

    try {
        const data = req.body;

        // if data is not present in req.body
        if (Object.keys(data).length == 0)
            return res.status(400).send({ status: false, message: "Please provide some data" });

        let { fname, lname, title, email, password } = data

        if (!fname)
            return res.status(400).send({ status: false, message: "Please provide author first name" });

        // validation for first name
        if (!validtion.nameValidation(fname))
            return res.status(400).send({ status: false, message: "first name contains only small and capital letters without spcae" });

        if (!lname)
            return res.status(400).send({ status: false, message: "Please provide author last name" });

        // validation for last name
        if (!validtion.nameValidation(lname))
            return res.status(400).send({ status: false, message: "last name contains only small and capital letters without spcae" });

        if (!title)
            return res.status(400).send({ status: false, message: "Please provide author title" });

        // validation for title
        if (!(["Mr", "Mrs", "Miss"].includes(title)))
            return res.status(400).send({ status: false, message: "Please provide author title as Mr/Mrs/Miss" });

        if (!email)
            return res.status(400).send({ status: false, message: "Please provide author email" });

        // validation for email
        if (!validtion.emailValidation(email))
            return res.status(400).send({ status: false, message: "Email should be like this - abc123@gmail.com" })

        let findEmail = await authorModel.findOne({ email })
        if (findEmail)
            return res.status(400).send({ status: false, message: 'This email is already exists' })

        if (!password)
            return res.status(400).send({ status: false, message: "Please provide author password" });

        // validation for password
        if (!validtion.pwValidation(password))
            return res.status(400).send({ status: false, message: "password should be look this - Pass123@" })

        // author created and returned
        const createdAuth = await authorModel.create(data);
        return res.status(201).send({ status: true, data: createdAuth })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//========================================================================================

const login = async function (req, res) {

    try {
        let data = req.body

        if (Object.keys(data).length == 0)
            return res.status(400).send({ status: false, message: "Please provide some data" });

        const { email, password } = data

        if (!email)
            return res.status(400).send({ status: false, message: "Please provide email" });

        if (!password)
            return res.status(400).send({ status: false, message: "Plese provide password" });

        // finding user with email and password
        const findUser = await authorModel.findOne({ email: email, password: password });
        if (!findUser)
            return res.status(400).send({ status: false, message: "Email or password is incorrect" })

        // creating token
        const token = jwt.sign({ user: findUser._id }, process.env.SECRETKEY, {expiresIn : "30m"});

        return res.status(200).send({ status: true, data: token })
    }
    catch (err) {
        return res.status(400).send({ status: false, message: err.message })
    }
}

module.exports = { createAuthor, login }