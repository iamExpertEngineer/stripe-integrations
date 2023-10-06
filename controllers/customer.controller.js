// Import necessary libraries and services
const Joi = require('joi')
const joiToForms = require('joi-errors-for-forms').form
const stripeService = require('../service/stripe.service')

/**
 * This function will create customer on stripe
 *
 * @param {*} req HTTP request object
 * @param {*} res HTTP response object
 */
const create = async (req, res) => {
    // Extract data from request body
    const bodyData = req.body

    // Define validation rules using Joi
    const validationsRules = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
        addressLine1: Joi.string().required(),
        addressLine2: Joi.string().allow(''),
        city: Joi.string().required(),
        state: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required()
    })
    const validationResult = validationsRules.validate({
        name: bodyData.name,
        email: bodyData.email,
        phone: bodyData.phone,
        addressLine1: bodyData.addressLine1,
        addressLine2: bodyData.addressLine2,
        city: bodyData.city,
        state: bodyData.state,
        postalCode: bodyData.postalCode,
        country: bodyData.country
    }, {
        abortEarly: false
    })

    // Convert validation errors to a more user-friendly format
    const convertToForms = joiToForms() // Define the joiToForms function
    const validationError = convertToForms(validationResult.error)

    // If validation fails, send an error response
    if (validationError) {
        return res.status(200).json({
            success: false,
            message: 'Validations Failed',
            error: validationError
        })
    }

    try {
        // Create customer data object for Stripe
        const customerCreate = {
            name: bodyData.name,
            email: bodyData.email,
            phone: bodyData.phone,
            address: {
                line1: bodyData.addressLine1,
                line2: bodyData.addressLine2,
                city: bodyData.city,
                state: bodyData.state,
                postal_code: bodyData.postalCode,
                country: bodyData.country
            }
        }

        // Create a customer using Stripe service
        const customer = await stripeService.createCustomer(customerCreate)

        // Send success response
        return res.status(200).json({
            success: true,
            message: 'Stripe customer create successfully',
            response: customer
        })
    } catch (err) {
        // Handle any errors that occurred during the process
        return res.status(200).json({
            success: false,
            message: err.message,
            response: err
        })
    }
}

/**
 * This function will return a customer record from stripe
 *
 * @param {*} req HTTP request object
 * @param {*} res HTTP response object
 */
const retrieve = async (req, res) => {
    // Extract data from request body
    const stripeCustomerId = req.query.stripeCustomerId // Assuming you get the customer ID from the query parameter

    // Define validation rules using Joi
    const validationsRules = Joi.object({
        stripeCustomerId: Joi.string().required()
    })
    const validationResult = validationsRules.validate({
        stripeCustomerId: req.query.stripeCustomerId
    }, {
        abortEarly: false
    })

    // Convert validation errors to a more user-friendly format
    const convertToForms = joiToForms()
    const validationError = convertToForms(validationResult.error)

    // If validation fails, send an error response
    if (validationError) {
        return res.status(200).json({
            success: false,
            message: 'Validations Failed',
            error: validationError
        })
    }

    try {
        // Retrieve a customer using Stripe service
        const customer = await stripeService.getCustomer(stripeCustomerId)

        // Send success response
        return res.status(200).json({
            success: true,
            message: 'Stripe customer retrieved successfully',
            response: customer
        })
    } catch (err) {
        // Handle any errors that occurred during the process
        return res.status(200).json({
            success: false,
            message: err.message,
            response: err
        })
    }
}

/**
 * This function will update customer details on stripe
 *
 * @param {*} req HTTP request object
 * @param {*} res HTTP response object
 */
const update = async (req, res) => {
    // Extract data from request body
    const bodyData = req.body

    // Define validation rules using Joi
    const validationRules = Joi.object({
        stripeCustomerId: Joi.string().required(),
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
        addressLine1: Joi.string().required(),
        addressLine2: Joi.string().allow(''),
        city: Joi.string().required(),
        state: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required()
    })

    const validationResult = validationRules.validate(bodyData, {
        abortEarly: false
    })

    // Convert validation errors to a more user-friendly format
    if (validationResult.error) {
        const validationError = validationResult.error.details.map(detail => {
            return {
                field: detail.context.key,
                message: detail.message
            }
        })

        // If validation fails, send an error response
        return res.status(200).json({
            success: false,
            message: 'Validations Failed',
            error: validationError
        })
    }

    try {
        // Update customer data object for Stripe
        const customerUpdate = {
            name: bodyData.name,
            email: bodyData.email,
            phone: bodyData.phone,
            address: {
                line1: bodyData.addressLine1,
                line2: bodyData.addressLine2,
                city: bodyData.city,
                state: bodyData.state,
                postal_code: bodyData.postalCode,
                country: bodyData.country
            }
        }

        // Update a customer using Stripe service
        const updatedCustomer = await stripeService.updateCustomer(bodyData.stripeCustomerId, customerUpdate)

        // Send success response
        return res.status(200).json({
            success: true,
            message: 'Stripe customer updated successfully',
            response: updatedCustomer
        })
    } catch (err) {
        // Handle any errors that occurred during the process
        return res.status(200).json({
            success: false,
            message: err.message,
            response: err
        })
    }
}

module.exports = {
    create,
    retrieve,
    update
}
