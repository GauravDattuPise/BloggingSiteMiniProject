
const mongoose = require('mongoose')
const authorModel = require('../models/authorModel');
const blogModel = require("../models/blogModel");

// For creating blog, taking authorId from user, and checking authorId exists in database or not.
const createBlog = async function (req, res) {

    try {
        let data = req.body

        if (Object.keys(data).length == 0)
            return res.status(400).send({ status: false, message: "Please enter some data" });

        // destructuring from data object
        let { title, body, authorId, category } = data

        if (!title) {
            return res.status(400).send({ status: false, message: "please provide title" })
        }
        if (!body) {
            return res.status(400).send({ status: false, message: "please provide body" })
        }
        if (!authorId) {
            return res.status(400).send({ status: false, message: "please provide authorId" })
        }
        if (!category) {
            return res.status(400).send({ status: false, message: "please provide category" })
        }

        //checking autorId is valid ObjectId or not
        if (!mongoose.isValidObjectId(authorId)) {
            return res.status(400).send({ status: false, message: "please provide valid format authorId" })
        }

        //checking authorID exists or not
        const findAuthor = await authorModel.findById(authorId);
        if (!findAuthor) {
            return res.status(404).send({ status: false, message: "This author is not exists" })
        }

        // saving author details into database
        const createdBlog = await blogModel.create(data);

        // sending created blog in response
        return res.status(201).send({ status: true, data: createdBlog })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//===============================================================================================================


// getting blogs by providing some conditions

const getBlogs = async function (req, res) {

    try {

        const qparams = req.query

        // if any query is not given,
        // then return the blogs which are published and not deleted
        if (Object.keys(qparams).length == 0) {
            const findBlogs = await blogModel.find({ isDeleted: false, isPublished: true });

            if (findBlogs.length === 0) {
                return res.status(404).send({ status: false, message: "No such blog found" })
            }
            return res.status(200).send({ status: true, data: findBlogs })
        }

        else {
            // adding key and values pairs in qparams object
            qparams.isDeleted = false
            qparams.isPublished = true

            let { authorId, tags, category, subcategory } = qparams

            // If none of the following keys not in qparams
            if (!(authorId || tags || category || subcategory)) {
                return res.status(400).send({ status: false, message: "Key should be in (authorID/tags/category/subcategory)" })
            }

            // checking blogs exists or not using qparams conditions
            const findBlogs = await blogModel.find(qparams)
            if (findBlogs.length == 0) {
                return res.status(404).send({ status: false, message: "No such blog found" })
            }

            // If blogs are available then send blogs in response
            return res.status(200).send({ status: true, data: findBlogs })
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//=========================================================================================================

// Updating a blog by changing its title, body, adding tags, adding a subcategory. 

const updateBlog = async function (req, res) {

    try {
        const blogId = req.params.blogId
        const data = req.body
        const { title, body, tags, subcategory } = data

        if (!blogId) {
            return res.status(400).send({ status: false, message: "blogId is required" })
        }
        // blogId is valid blogId or not
        if (!mongoose.isValidObjectId(blogId)) {
            return res.status(400).send({ status: false, message: "format of blogId is invalid" })
        }
        // checking blog is exists or not
        const isBlogExists = await blogModel.findOne({ _id: blogId, isDeleted: false })
        if (!isBlogExists) {
            return res.status(404).send({ status: false, message: "No such blog found" })
        }

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "some data is requiered to upadate" })
        }

        if (!(title || body || tags || subcategory)) {
            return res.status(400).send({ status: false, message: "Plese provide valid key to update" })
        }

        // updating blogs
        const updatedBlog = await blogModel.findOneAndUpdate({ _id: blogId, isDeleted: false },
            {
                $push: { tags: tags, subcategory: subcategory },
                $set: { title: title, body: body, isPublished: true, publishedAt: Date.now() }
            },
            { new: true }
        );

        return res.status(200).send({ status: true, data: updatedBlog })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//===============================================================================================================

// Deleting blog using path param

const deleteBlog = async function (req, res) {

    try {
        const blogId = req.params.blogId

        if (!mongoose.isValidObjectId(blogId))
            return res.status(400).send({ status: false, message: "Please provide valid blogId" })

        // finding blog exists or not
        const isBlogExists = await blogModel.findOne({ _id: blogId, isDeleted: false })
        if (!isBlogExists) {
            return res.status(404).send({ status: false, message: "blog not found" })
        }

        // deleting blog and provide time
        const blogDeletion = await blogModel.findOneAndUpdate(
            { _id: blogId, isDeleted: false },
            { $set: { isDeleted: true, deletedAt: Date.now() } }
        );

        return res.status(200).send({ status: true, message: "blog deleted succefully" });
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//===============================================================================================================

// Delete blog documents by category, authorid, tag name, subcategory name, unpublished

const deleteByQueryP = async function (req, res) {

    try {
        const data = req.query

        // if we do not provide any query
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Please provide some data to delete blog" })
        }
        const { category, authorId, tags, subcategory, isPublished } = data

        if (!(category || authorId || tags || subcategory || isPublished)) {
            return res.status(400).send({ status: false, message: "Please provide keys in between this (category/authorId/tags/subcategory)" })
        }

        // adding isDeleted = false in data
        data.isDeleted = false
        const findBlog = await blogModel.updateMany(data, { $set: { isDeleted: true, deletedAt: Date.now() } })
       console.log(findBlog);
        const count = findBlog.modifiedCount
        // checking how many blogs are modified
        if (count != 0) {
            return res.status(200).send({ status: true, data: `${count} blog is deleted` })
        }

        return res.status(404).send({ status: false, message: "No blog found to delete" })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createBlog, getBlogs, updateBlog, updateBlog, deleteBlog, deleteByQueryP }