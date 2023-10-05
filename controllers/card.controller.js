// Import necessary libraries and services
const moment = require('moment')
const Joi = require('joi')
const joiToForms = require('joi-errors-for-forms').form
const stripeService = require('../service/stripe.service')
const errorMessages = require('../utils/error.messages')

/**
 * This function will add a payment card on stripe and attach with stripe customer
 *
 * @param {*} req HTTP request object
 * @param {*} res HTTP response object
 * @author Rohit Kumar
 */
const add = async (req, res) => {
    const bodyData = req.body

    const validationsRules = Joi.object({
        stripeCustomerId: Joi.string().required(),
        type: Joi.string().required().valid('card'),
        cardNumber: Joi.number().integer().positive().greater(0).required(),
        expiryMonth: Joi.number().integer().positive().greater(0).required(),
        expiryYear: Joi.number().integer().positive().greater(0).required(),
        cvc: Joi.number().integer().positive().greater(0).required()
    })
    const validationResult = validationsRules.validate({
        stripeCustomerId: bodyData.stripeCustomerId,
        type: bodyData.type,
        cardNumber: bodyData.cardNumber,
        expiryMonth: bodyData.expiryMonth,
        expiryYear: bodyData.expiryYear,
        cvc: bodyData.cvc
    }, {
        abortEarly: false
    })
    const convertToForms = joiToForms()
    const validationError = convertToForms(validationResult.error)
    if (validationError) {
        return res.status(200).json({
            success: false,
            message: 'Validations Failed',
            error: validationError
        })
    }

    try {
        const object = {
            type: bodyData.type,
            card: {
                number: bodyData.cardNumber,
                exp_month: bodyData.expiryMonth,
                exp_year: bodyData.expiryYear,
                cvc: bodyData.cvc
            }
        }
        const response = await stripeService.addPaymentMethod(object)
        if (response) {
            await stripeService.attachPaymentMethodToCustomer({
                paymentMethodId: response.id,
                customerId: bodyData.stripeCustomerId
            })
        }
        return res.status(200).json({
            success: true,
            message: 'Payment method added successfully',
            response
        })
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: err.message,
            response: {}
        })
    }
}

/**
 * This function will retrieve all payment cards which are attached with stripe customer
 *
 * @param {*} req HTTP request object
 * @param {*} res HTTP response object
 * @author Rohit Kumar
 */
const list = async (req, res) => {
    try {
        const bodyData = req.query

        const validationsRules = Joi.object({
            stripeCustomerId: Joi.string().required(),
            type: Joi.string().valid('card', 'us_bank_account'),
            limit: Joi.number(),
            startingAfter: Joi.string()
        })
        const validationResult = validationsRules.validate({
            stripeCustomerId: bodyData.stripeCustomerId,
            type: bodyData.type,
            limit: bodyData.limit,
            startingAfter: bodyData.startingAfter
        }, {
            abortEarly: false
        })
        const convertToForms = joiToForms()
        const validationError = convertToForms(validationResult.error)
        if (validationError) {
            return res.status(200).json({
                success: false,
                message: 'Validations Failed',
                error: validationError
            })
        }

        const type = bodyData.type ? bodyData.type : 'card'

        // 1) Find Customer
        const customer = await stripeService.getCustomer(bodyData.stripeCustomerId)
        const defaultMethod = customer.invoice_settings.default_payment_method
        const paymentMethodArray = []

        // 2) Get payment method list from stripe
        await stripeService.listPaymentMethod(bodyData.stripeCustomerId, type, bodyData).then(paymentMethodList => {
            for (const paymentMethod of paymentMethodList.data) {
                if (defaultMethod == paymentMethod.id) {
                    paymentMethod.default = true
                } else {
                    paymentMethod.default = false
                }
                paymentMethodArray.push(paymentMethod)
            }
            paymentMethodList.data = paymentMethodArray
            return res.status(200).json({
                success: true,
                response: paymentMethodList
            })
        }).catch(err => {
            console.error('Card List : stripeService.listPaymentMethod() : Error :', err.message)
            return res.status(200).json({
                success: false,
                message: 'Failed to retrieve payment methods'
            })
        })
    } catch (error) {
        console.error('Card List : Catch() : Error :', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
}

/**
 * This function will delete a payment card from stripe customer
 *
 * @param {*} req HTTP request object
 * @param {*} res HTTP response object
 * @author Unknown
 * @modified_by Rohit Kumar
 */
const cardDelete = async (req, res) => {
    const bodyData = req.body
    const type = 'card'

    // Prepare validation rules
    const validationRules = Joi.object({
        stripeCustomerId: Joi.string().required(),
        paymentMethodId: Joi.string().required()
    })

    // Applying validation rules
    const validationResult = validationRules.validate({
        stripeCustomerId: bodyData.stripeCustomerId,
        paymentMethodId: bodyData.paymentMethodId
    }, {
        abortEarly: false
    })

    // Checking for any validation error, If received error then throw it to client
    const convertToForms = joiToForms()
    const validationError = convertToForms(validationResult.error)

    if (validationError) {
        console.error('cardDelete(): validation error: %o', validationResult.error)
        return res.status(200).json({
            success: false,
            message: errorMessages.VALIDATION_FAILED,
            error: validationError
        })
    }

    try {
        stripeService.listPaymentMethod(bodyData.stripeCustomerId, type, undefined).then(paymentMethodList => {
            console.log('paymentMethodList', paymentMethodList)
            console.log('cardDelete(): stripeService.listPaymentMethod(): success')
            if (paymentMethodList.data.length < 1) {
                console.error('cardDelete(): stripeService.listPaymentMethod(): Failed: You cannot delete the last card, should have at-least one card')
                return res.status(200).json({
                    success: false,
                    message: 'You cannot delete the last card, should have at-least one card'
                })
            } else {
                const currentMonthYear = moment().format('YYYY-MM')
                const activeCardsArray = []
                const expiryCardsArray = []
                const activeCardsIdArray = []
                const expiryCardsIdArray = []
                for (const singleCard of paymentMethodList.data) {
                    const cardExpiryMY = singleCard.card.exp_year + '-' + singleCard.card.exp_month
                    if (cardExpiryMY > currentMonthYear) {
                        activeCardsArray.push(singleCard)
                        activeCardsIdArray.push(singleCard.id)
                    } else {
                        expiryCardsArray.push(singleCard)
                        expiryCardsIdArray.push(singleCard.id)
                    }
                }
                if (expiryCardsIdArray.includes(bodyData.paymentMethodId)) {
                    // delete expiry cards
                    stripeService.deletePaymentMethod(bodyData.paymentMethodId).then((paymentMethod) => {
                        console.log('cardDelete()(): stripeService.deletePaymentMethod(): success')
                        return res.status(200).json({
                            success: true,
                            message: 'PaymentMethod object detached from a Customer successfully.',
                            response: paymentMethod
                        })
                    }).catch((err) => {
                        console.error('cardDelete()(): stripeService.deletePaymentMethod(): error: %o', err)
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to delete payment method'
                        })
                    })
                } else if (activeCardsIdArray.includes(bodyData.paymentMethodId)) {
                    // delete active cards
                    console.log(activeCardsIdArray.length)
                    console.log(activeCardsIdArray.length == 1)
                    if (activeCardsIdArray.length == 1) {
                        console.error('cardDelete(): (): Failed: You should have at-least one active card')
                        return res.status(200).json({
                            success: false,
                            message: 'You should have at-least one active card'
                        })
                    } else {
                        // delete cards
                        stripeService.deletePaymentMethod(bodyData.paymentMethodId).then((paymentMethod) => {
                            console.log('cardDelete()(): stripeService.deletePaymentMethod(): success')
                            return res.status(200).json({
                                success: true,
                                message: 'PaymentMethod object detached from a Customer successfully.',
                                response: paymentMethod
                            })
                        }).catch((err) => {
                            console.error('cardDelete()(): stripeService.deletePaymentMethod(): error: %o', err)
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to delete payment method',
                                response: {}
                            })
                        })
                    }
                } else {
                    // something went wrong
                    console.error('cardDelete(): deletePaymentMethod(): Failed: Invalid request to delete a card')
                    return res.status(200).json({
                        success: false,
                        message: 'Invalid request to delete a card'
                    })
                }
            }
        }).catch(err => {
            console.error('cardDelete(): stripeService.listPaymentMethod(): error: %o', err)
            return res.status(200).json({
                success: false,
                message: 'Failed to retrieve Card',
                response: {}
            })
        })
    } catch (err) {
        console.log(err, 'err')
        return res.status(200).json({
            success: false,
            message: err.message,
            response: {}
        })
    }
}

/**
 * This function will set as a default card to a stripe customer
 *
 * @param {*} req HTTP request object
 * @param {*} res HTTP response object
 * @author Rohit Kumar
 */
const setDefaultPayment = async (req, res) => {
    const body = req.body

    // 1) Validate request parameters
    try {
        const validationRules = Joi.object({
            stripeCustomerId: Joi.string().required(),
            paymentMethodId: Joi.string().required()
        })
        const validationResult = validationRules.validate({
            stripeCustomerId: body.stripeCustomerId,
            paymentMethodId: body.paymentMethodId
        }, {
            abortEarly: false
        })
        const convertToForms = joiToForms()
        const validationError = convertToForms(validationResult.error)
        if (validationError) {
            console.error('setDefaultPayment(): validation error: %o', validationResult.error)
            return res.status(200).json({
                success: false,
                message: errorMessages.VALIDATION_FAILED,
                error: validationError
            })
        }

        // 3) Attach payment method to stripe customer
        stripeService.addDefaultPaymentToCustomer({
            customerId: body.stripeCustomerId,
            paymentMethodId: body.paymentMethodId
        }).then(paymentMethod => {
            console.log('setDefaultPayment(): stripeService.addDefaultPaymentToCustomer(): success')
            res.status(200).json({
                success: true,
                message: 'Payment method set default for payment'
            })
        }).catch(err => {
            console.error('setDefaultPayment(): stripeService.addDefaultPaymentToCustomer(): error: %o', err)
            const customError = errorMessages.getCustomStripeError(err)
            return res.status(200).json({
                success: false,
                message: customError.message
            })
        })
    } catch (error) {
        console.error('setDefaultPayment(): catch(): error: %o', error)
        res.status(500).json({
            success: false,
            message: errorMessages.INTERNAL_SERVER_ERROR
        })
    }
}

/**
 * This function will retrieve a specific card details of a stripe customer
 *
 * @param {*} req HTTP request object
 * @param {*} res HTTP response object
 * @author Rohit Kumar
 */
const paymentMethodDetails = async (req, res) => {
    const body = req.query

    // 1) Validate request parameters
    try {
        const validationRules = Joi.object({
            paymentMethodId: Joi.string().allow('').allow(null)
        })
        const validationResult = validationRules.validate({
            paymentMethodId: body.paymentMethodId
        }, {
            abortEarly: false
        })
        const convertToForms = joiToForms()
        const validationError = convertToForms(validationResult.error)
        if (validationError) {
            console.error('paymentMethodDetails(): validation error: %o', validationResult.error)
            return res.status(200).json({
                success: false,
                message: errorMessages.VALIDATION_FAILED,
                error: validationError
            })
        }
        await stripeService.retrievePaymentMethod(body.paymentMethodId).then(paymentMethodObj => {
            res.status(200).json({
                success: true,
                message: 'Payment method fetched successfully',
                response: paymentMethodObj
            })
        }).catch(err => {
            console.error('paymentMethodDetails(): error: %o', err)
        })
    } catch (error) {
        console.error('paymentMethodDetails(): catch(): error: %o', error)
        res.status(500).json({
            success: false,
            message: errorMessages.INTERNAL_SERVER_ERROR
        })
    }
}

module.exports = {
    add,
    list,
    cardDelete,
    setDefaultPayment,
    paymentMethodDetails
}
