// IMPORT SECTION
module.exports.VALIDATION_FAILED = 'Validation failed for given parameters'
module.exports.INTERNAL_SERVER_ERROR = 'Internal Server Error'

/**
 * @param {*} error(error & declined codes)
 * @returns {string} Declined errors based on stripe error code & declined code
 * @author Rohit Kumar
 */
function getCustomStripeError (error) {
    let errorObject = {
        statusCode: 500,
        message: 'Internal Server Error'
    }
    if (error.code) {
        switch (error.code) {
        case 'card_declined':
            errorObject = getCardDeclinedError(error)
            break
        default:
            console.error('getCustomStripeError(): default case: Stripe error code not found')
            errorObject.statusCode = 200
            errorObject.message = error.message
        }
    } else {
        errorObject.message = error.message
    }
    return errorObject
}
module.exports.getCustomStripeError = getCustomStripeError

function getCardDeclinedError (error) {
    const declinedWithUnknownReason = 'The card has been declined for an unknown reason, please contact your card issuer for more information.'
    const errorObject = {
        statusCode: 200,
        message: declinedWithUnknownReason
    }
    const incorrectCvc = 'The CVC number is incorrect. You should try again using the correct CVC.'
    const incorrectCardNumber = 'The card number is incorrect. You should try again using the correct card number.'
    const incorrectPin = 'The PIN entered is incorrect. You should try again using the correct PIN.'
    switch (error.decline_code) {
    case 'authentication_required':
        errorObject.message = 'The card was declined as the transaction requires authentication, please try again and authenticate the card when prompted during the transaction.'
        break
    case 'approve_with_id':
        errorObject.message = 'The payment cannot be authorized, please try again. If it still cannot be processed, please contact your card issuer.'
        break
    case 'call_issuer':
        errorObject.message = declinedWithUnknownReason
        break
    case 'card_not_supported':
        errorObject.message = 'The card does not support this type of purchase. Please contact your card issuer to make sure your card can be used to make this type of purchase.'
        break
    case 'card_velocity_exceeded':
        errorObject.message = 'You have exceeded the balance or credit limit available on your card. Please contact your card issuer for more information.'
        break
    case 'currency_not_supported':
        errorObject.message = 'Your card does not support the specified currency.'
        break
    case 'do_not_honor':
        errorObject.message = declinedWithUnknownReason
        break
    case 'do_not_try_again':
        errorObject.message = declinedWithUnknownReason
        break
    case 'duplicate_transaction':
        errorObject.message = 'A transaction with identical amount and credit card information was submitted very recently. Please check to see if a recent payment already exists.'
        break
    case 'expired_card':
        errorObject.message = 'The card has expired, you should use another card.'
        break
    case 'fraudulent':
        errorObject.message = declinedWithUnknownReason
        break
    case 'generic_decline':
        errorObject.message = declinedWithUnknownReason
        break
    case 'incorrect_number':
        errorObject.message = incorrectCardNumber
        break
    case 'incorrect_cvc':
        errorObject.message = incorrectCvc
        break
    case 'incorrect_pin':
        errorObject.message = incorrectPin
        break
    case 'incorrect_zip':
        errorObject.message = 'The ZIP/postal code is incorrect. You should try again using the correct billing ZIP/postal code.'
        break
    case 'insufficient_funds':
        errorObject.message = 'The card has insufficient funds to complete the purchase. You can use an alternative payment method.'
        break
    case 'invalid_account':
        errorObject.message = 'The card, or account the card is connected to, is invalid. Please contact your card issuer to check that the card is working correctly.'
        break
    case 'invalid_amount':
        errorObject.message = 'The payment amount is invalid, or exceeds the amount that is allowed. If the amount appears to be correct, please check with your card issuer that they can make purchases of that amount.'
        break
    case 'invalid_cvc':
        errorObject.message = incorrectCvc
        break
    case 'invalid_expiry_year':
        errorObject.message = 'The expiration year is invalid. please try again using the correct expiration year.'
        break
    case 'invalid_number':
        errorObject.message = incorrectCardNumber
        break
    case 'invalid_pin':
        errorObject.message = incorrectPin
        break
    case 'issuer_not_available':
        errorObject.message = 'The card issuer could not be reached, so the payment could not be authorized. Please try again. If it still cannot be processed, please contact your card issuer.'
        break
    case 'lost_card':
        errorObject.message = declinedWithUnknownReason
        break
    case 'merchant_blacklist':
        errorObject.message = declinedWithUnknownReason
        break
    case 'new_account_information_available':
        errorObject.message = 'Your card, or account the card is connected to, is invalid. Please contact your card issuer for more information.'
        break
    case 'no_action_taken':
        errorObject.message = declinedWithUnknownReason
        break
    case 'not_permitted':
        errorObject.message = 'The payment is not permitted., please contact your card issuer for more information.'
        break
    case 'offline_pin_required':
        errorObject.message = 'The card has been declined as it requires a PIN. Please try again by inserting your card and entering a PIN.'
        break
    case 'online_or_offline_pin_required':
        errorObject.message = 'The card has been declined as it requires a PIN. Please try again by inserting your card and entering a PIN.'
        break
    case 'pickup_card':
        errorObject.message = 'The card cannot be used to make this payment (it is possible it has been reported lost or stolen). Please contact your card issuer for more information.'
        break
    case 'pin_try_exceeded':
        errorObject.message = 'The allowable number of PIN tries has been exceeded. Please use another card or method of payment.'
        break
    case 'processing_error':
        errorObject.message = 'An error occurred while processing the card. Please try again. If it still cannot be processed, try again later.'
        break
    case 'reenter_transaction':
        errorObject.message = 'The payment could not be processed by the issuer for an unknown reason. Please try again. If it still cannot be processed, please contact your card issuer.'
        break
    case 'restricted_card':
        errorObject.message = 'The card cannot be used to make this payment (it is possible it has been reported lost or stolen). Please contact your card issuer for more information.'
        break
    case 'revocation_of_all_authorizations':
        errorObject.message = declinedWithUnknownReason
        break
    case 'revocation_of_authorization':
        errorObject.message = declinedWithUnknownReason
        break
    case 'security_violation':
        errorObject.message = declinedWithUnknownReason
        break
    case 'service_not_allowed':
        errorObject.message = declinedWithUnknownReason
        break
    case 'stolen_card':
        errorObject.message = declinedWithUnknownReason
        break
    case 'stop_payment_order':
        errorObject.message = declinedWithUnknownReason
        break
    case 'testmode_decline':
        errorObject.message = 'A test card number was used. A genuine card must be used to make a payment.'
        break
    case 'transaction_not_allowed':
        errorObject.message = declinedWithUnknownReason
        break
    case 'try_again_later':
        errorObject.message = 'The card has been declined for an unknown reason. Please try again. If subsequent payments are declined, please contact your card issuer for more information.'
        break
    case 'withdrawal_count_limit_exceeded':
        errorObject.message = 'You have exceeded the balance or credit limit available on your card. You can use an alternative payment method.'
        break
    default:
        console.error('getCardDeclinedError(): default case: card declined error code not found')
    }
    return errorObject
}
