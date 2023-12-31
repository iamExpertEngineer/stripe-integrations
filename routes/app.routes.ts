/*
 * The route.js file contains all the API routes for processing payments through Stripe.
 * By consolidating these routes in one file, the code becomes more organized, easier to
 * maintain, and facilitates future updates. These routes allow the application to handle
 * various payment requests, such as creating a new payment method or processing a payment using a saved method.
 * The use of Stripe's API also ensures that all transactions are secure, quick and reliable,
 * making it an ideal payment processing system for businesses.
*/

// IMPORT SECTION
const express = require('express')
const router = express.Router()

// Controller
const customerController = require('../controllers/customer.controller.ts')
const cardController = require('../controllers/card.controller.ts')

// Customer Controller Routes
router.post('/customer/create', customerController.create)
router.get('/customer/retrieve', customerController.retrieve)
router.post('/customer/update', customerController.update)

// Card Controller Routes
router.post('/card/add', cardController.add)
router.get('/card/list', cardController.list)
router.post('/card/delete', cardController.cardDelete)
router.post('/card/set-default', cardController.setDefaultPayment)
router.get('/card/details', cardController.paymentMethodDetails)

// This should be always in the bottom
// This'll be show date time for home route
router.all('/', function timeLog (req, res) {
    const today = new Date().toString()
    const str = '****' + today
    res.send(str)
})

// This'll be for all wrong routes
router.all('*', function notFound (req, res) {
    res.status(404).send('404 page')
})

module.exports = router
