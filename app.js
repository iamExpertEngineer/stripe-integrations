// IMPORT SECTION
require('dotenv').config()

const bodyParser = require('body-parser')
const express = require('express')
const cors = require('cors')
const paginate = require('express-paginate')
const indexRouter = require('./routes/app.routes.ts')
const port = process.env.PORT || 4242

// Initialize the express application
const app = express()
app.use(paginate.middleware(10, 50))
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use('/', indexRouter)

app.listen(port, () => {
    console.log(`Node server listening on port ${port}!`)
})
