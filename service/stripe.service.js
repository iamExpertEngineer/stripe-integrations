require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const methods = {}

// ------------- Stripe Customer API's
async function createCustomer (params) {
    return await stripe.customers.create(params)
}

async function getCustomer (customerId) {
    return await stripe.customers.retrieve(customerId)
}

async function updateCustomer (stripeCustomerId, data) {
    return await stripe.customers.update(stripeCustomerId, data)
}

// ------------- Stripe Customer API's
async function addPaymentMethod (params) {
    return await stripe.paymentMethods.create(params)
}

async function listPaymentMethod (customerId, type, bodyData) {
    const requestOptions = {
        customer: customerId,
        type,
        limit: 8
    }
    if (bodyData && bodyData.startingAfter) {
        requestOptions.starting_after = bodyData.startingAfter
    }
    if (bodyData && bodyData.limit) {
        requestOptions.limit = bodyData.limit
    }
    const result = await stripe.paymentMethods.list(requestOptions)

    return result
}

async function addDefaultPaymentToCustomer (params) {
    return await stripe.customers.update(params.customerId, {
        invoice_settings: {
            default_payment_method: params.paymentMethodId
        }
    })
}

async function retrievePaymentMethod (paymentMethodId) {
    const result = await stripe.paymentMethods.retrieve(paymentMethodId)
    return result
}

/**
 * Detaches a PaymentMethod object from a Customer.
 */
async function deletePaymentMethod (cardId) {
    const paymentMethodId = cardId
    console.log(paymentMethodId)
    const result = await stripe.paymentMethods.detach(paymentMethodId)
    return result
}

methods.createCustomer = createCustomer
methods.getCustomer = getCustomer
methods.updateCustomer = updateCustomer
methods.addPaymentMethod = addPaymentMethod
methods.listPaymentMethod = listPaymentMethod
methods.deletePaymentMethod = deletePaymentMethod
methods.addDefaultPaymentToCustomer = addDefaultPaymentToCustomer
methods.retrievePaymentMethod = retrievePaymentMethod

module.exports = methods
