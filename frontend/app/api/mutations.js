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

export const SET_ORDER_SHIPPING_ADDRESS = gql`
  mutation SetOrderShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ...Cart
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export const SET_ORDER_BILLING_ADDRESS = gql`
  mutation SetOrderBillingAddress($input: CreateAddressInput!) {
    setOrderBillingAddress(input: $input) {
      ...Cart
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export const SET_ORDER_SHIPPING_METHOD = gql`
  mutation SetOrderShippingMethod($shippingMethodId: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      ...Cart
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export const APPLY_COUPON_CODE = gql`
  mutation ApplyCouponCode($couponCode: String!) {
    applyCouponCode(couponCode: $couponCode) {
      ...Cart
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export const REMOVE_COUPON_CODE = gql`
  mutation RemoveCouponCode($couponCode: String!) {
    removeCouponCode(couponCode: $couponCode) {
      ...Cart
    }
  }
  ${CART_FRAGMENT}
`;

export const TRANSITION_ORDER_TO_STATE = gql`
  mutation TransitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      ...Cart
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export const CREATE_CUSTOMER_ADDRESS = gql`
  mutation CreateCustomerAddress($input: CreateAddressInput!) {
    createCustomerAddress(input: $input) {
      id
    }
  }
`;

export const UPDATE_CUSTOMER_ADDRESS = gql`
  mutation UpdateCustomerAddress($input: UpdateAddressInput!) {
    updateCustomerAddress(input: $input) {
      id
    }
  }
`;

