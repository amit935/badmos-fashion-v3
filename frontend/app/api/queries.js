import { gql } from 'graphql-request';
import { CART_FRAGMENT } from './fragments';

/**
 * USER AUTHENTICATION QUERIES
 */

// GET CURRENT LOGGED-IN USER
export const GET_ACTIVE_CUSTOMER = gql`
  query GetActiveCustomer {
    activeCustomer {
      id
      firstName
      lastName
      emailAddress
    }
  }
`;

/**
 * CART AUTHENTICATION QUERIES
 */
export const GET_ACTIVE_ORDER = gql`
  query GetActiveOrder {
    activeOrder { ...Cart }
  }
  ${CART_FRAGMENT}
`;

export const GET_CHECKOUT_CUSTOMER = gql`
  query GetCheckoutCustomer {
    activeCustomer {
      id
      firstName
      lastName
      phoneNumber
      addresses {
        id
        fullName
        phoneNumber
        streetLine1
        streetLine2
        city
        province
        postalCode
        country {
          code
        }
        defaultShippingAddress
        defaultBillingAddress
      }
    }
  }
`;

export const GET_ELIGIBLE_SHIPPING_METHODS = gql`
  query GetEligibleShippingMethods {
    eligibleShippingMethods {
      id
      name
      priceWithTax
    }
  }
`;