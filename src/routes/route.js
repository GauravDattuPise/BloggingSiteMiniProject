const express = require('express');
const router = express.Router();

const {createAuthor,login} = require('../controllers/authorController');
const {createBlog,getBlogs,updateBlog,deleteBlog,deleteByQueryP} = require('../controllers/blogController');
const {authentication,authorisation} = require('../middleware/middleware')


// CREATING AUTHOR
router.post("/authors", createAuthor);

// AUTHOR LOGIN
router.post('/login',login)

// CREATING BLOGS
router.post('/blogs', authentication,authorisation,createBlog)

// GET BLOGS
router.get("/blogs", authentication,getBlogs)

// UPDATE BLOGS
router.patch("/blogs/:blogId",authentication,authorisation, updateBlog)

// DELETE BLOGS BY ID
router.delete("/blogs/:blogId",authentication,authorisation,deleteBlog)

// DELETE BLOGS BY PARAMS
router.delete("/blogs",authentication,authorisation, deleteByQueryP)

module.exports = router