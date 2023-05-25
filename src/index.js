const express = require('express');
const mongoose = require('mongoose')
const route = require('./routes/route')
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.json());

mongoose.set('strictQuery', true);

mongoose.connect(process.env.DATABASE)
    .then(()=> console.log("Database is connected.")) 
    .catch((err) => console.log(err));

app.use('/', route);

app.listen(process.env.PORT, function(){
    console.log("Server is running on", process.env.PORT)
}) 

