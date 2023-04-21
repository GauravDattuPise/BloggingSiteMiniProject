// Create a blog document from request body. Get authorId in request body only.
// Make sure the authorId is a valid authorId by checking the author exist in the authors collection.
// Return HTTP status 201 on a succesful blog creation. Also return the blog document.

const mongoose = require('mongoose')
const authorModel = require('../models/authorModel');
const blogModel = require("../models/blogModel");

//===========================================================================================================

const createBlog = async function (req, res) {

    try {
        let data = req.body

        if (Object.keys(data).length == 0)
            return res.status(400).send({ status: false, message: "Please enter some data" });

        let { title, body, authorId, category } = data

        if (!title)
            return res.status(400).send({ status: false, message: "please provide title" })

        if (!body)
            return res.status(400).send({ status: false, message: "please provide body" })

        if (!authorId)
            return res.status(400).send({ status: false, message: "please provide authorId" })

        if (!category)
            return res.status(400).send({ status: false, message: "please provide category" })

        if (!mongoose.isValidObjectId(authorId))
            return res.status(400).send({ status: false, message: "please provide valid format authorId" })

        const findAuthor = await authorModel.findById(authorId);
        if (!findAuthor)
            return res.status(404).send({ status: false, message: "This author is not exists" })

        const createdBlog = await blogModel.create(data);
        return res.status(201).send({ status: true, data: createdBlog })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//===============================================================================================================

// GET /blogs
// Returns all blogs in the collection that aren't deleted and are published
// Return the HTTP status 200 if any documents are found. The response structure should be like this
// If no documents are found then return an HTTP status 404 with a response like this
// Filter blogs list by applying filters. Query param can have any combination of below filters.
// By author Id
// By category
// List of blogs that have a specific tag
// List of blogs that have a specific subcategory example of a query url: blogs?filtername=filtervalue&f2=fv2

const getBlogs = async function (req, res) {

    try {

        const qparams = req.query

        if (Object.keys(qparams).length == 0) {
            const findBlogs = await blogModel.find({ isDeleted: false, isPublished: true });

            if (findBlogs.length == 0) {
                return res.status(404).send({ status: false, message: "No such blog found" })
            }
            return res.status(200).send({ status: true, data: findBlogs })
        }
        else {
            qparams.isDeleted = false
            qparams.isPublished = true

            let { authorId, tags, category, subcategory } = qparams
            if (!(authorId || tags || category || subcategory)) {
                return res.status(400).send({ status: false, message: "Key should be in (authorID/tags/category/subcategory)" })
            }

            const findBlogs = await blogModel.find(qparams)
            if (findBlogs.length == 0) {
                return res.status(404).send({ status: false, message: "No such blog found" })
            }
            return res.status(200).send({ status: true, data: findBlogs })
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//================================================================================================================

// PUT /blogs/:blogId
// Updates a blog by changing the its title, body, adding tags, adding a subcategory. 
// (Assuming tag and subcategory received in body is need to be added)
// Updates a blog by changing its publish status i.e. adds publishedAt date and set published to true
// Check if the blogId exists (must have isDeleted false). If it doesn't,
//  return an HTTP status 404 with a response body like this
// Return an HTTP status 200 if updated successfully with a body like this
// Also make sure in the response you return the updated blog document.

const updateBlog = async function (req, res) {

    try {
        const blogId = req.params.blogId
        const data = req.body
        const { title, body, tags, subcategory } = data

        if (!blogId)
            return res.status(400).send({ status: false, message: "blogId is required" })

        if (!mongoose.isValidObjectId(blogId))
            return res.status(400).send({ status: false, message: "format of blogId is invalid" })

        // checking blog is exists or not
        const isBlogExists = await blogModel.findOne({ _id: blogId, isDeleted: false })
        if (!isBlogExists)
            return res.status(404).send({ status: false, message: "No such blog found" })

        if (Object.keys(data).length == 0)
            return res.status(400).send({ status: false, message: "some data is requiered to upadate" })

        if (!(title || body || tags || subcategory))
            return res.status(400).send({ status: false, message: "Plese provide valid key to update" })

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

// DELETE /blogs/:blogId
// Check if the blogId exists( and is not deleted). If it does, mark it deleted and 
// return an HTTP status 200 without any response body.
// If the blog document doesn't exist then return an HTTP status of 404 with a body like this

const deleteBlog = async function (req, res) {

    try {
        const blogId = req.params.blogId

        if (!mongoose.isValidObjectId(blogId))
            return res.status(400).send({ status: false, message: "Please provide valid blogId" })

        const isBlogExists = await blogModel.findById(blogId)
        if (!isBlogExists)
            return res.status(404).send({ status: false, message: "blog not found" })

        const blogDeletion = await blogModel.findOneAndUpdate(
            { _id: blogId, isDeleted: false },
            { $set: { isDeleted: true, deletedAt: Date.now() } }
        )

        if (blogDeletion)
            return res.status(200).send({ status: true, message: "blog deleted succefully" });

        return res.status(400).send({ status: false, message: "blog already deleted (path Params)" })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//===============================================================================================================

// DELETE /blogs?queryParams
// Delete blog documents by category, authorid, tag name, subcategory name, unpublished
// If the blog document doesn't exist then return an HTTP status of 404 with a body like this

const deleteByQueryP = async function (req, res) {

    try {
        const data = req.query

        if (Object.keys(data).length == 0)
            return res.status(400).send({ status: false, message: "Please provide some data to delete blog" })

        const { category, authorId, tags, subcategory, isPublished } = data

        if (!(category || authorId || tags || subcategory || isPublished))
            return res.status(400).send({ status: false, message: "Please provide keys in between this (category/authorId/tags/subcategory)" })

        data.isDeleted = false
        const findBlog = await blogModel.updateMany(data, { $set: { isDeleted: true, deletedAt: Date.now() } })
        const count = findBlog.modifiedCount
        //  console.log(count)
        if (count != 0)
            return res.status(200).send({ status: true, data: `${count} blog is deleted` })

        return res.status(400).send({ status: false, message: "No data found to delete" })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createBlog, getBlogs, updateBlog, updateBlog, deleteBlog, deleteByQueryP }