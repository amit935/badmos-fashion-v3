import { gql } from 'graphql-request';
import { CART_FRAGMENT } from './fragments';

/**
 * USER AUTHENTICATION MUTATIONS
 */

// REQUEST OTP - sends a one-time code to the user's email
export const REQUEST_LOGIN_OTP = gql`
  mutation RequestOtp($email: String!) {
    requestOtp(email: $email)
  }
`;

// AUTHENTICATE USER WITH OTP
export const AUTHENTICATE_WITH_OTP = gql`
  mutation AuthenticateWithOtp($email: String!, $code: String!) {
    authenticate(input: { otp: { email: $email, code: $code } }) {
      ... on CurrentUser {
        id
        identifier
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

// LOGOUT
export const LOGOUT = gql`
  mutation Logout {
    logout {
      success
    }
  }
`;


/**
 * CART MUTATIONS
 */
export const ADD_ITEM_TO_ORDER = gql`
  mutation AddItemToOrder($variantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $variantId, quantity: $quantity) {
      ...Cart
      ... on ErrorResult { errorCode message }
      ... on InsufficientStockError { quantityAvailable order { ...Cart } }
    }
  }
  ${CART_FRAGMENT}
`;

export const ADJUST_ORDER_LINE = gql`
  mutation AdjustOrderLine($lineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $lineId, quantity: $quantity) {
      ...Cart
      ... on ErrorResult { errorCode message }
      ... on InsufficientStockError { quantityAvailable order { ...Cart } }
    }
  }
  ${CART_FRAGMENT}
`;

export const REMOVE_ORDER_LINE = gql`
  mutation RemoveOrderLine($lineId: ID!) {
    removeOrderLine(orderLineId: $lineId) {
      ...Cart
      ... on ErrorResult { errorCode message }
    }
  }
  ${CART_FRAGMENT}
`;

