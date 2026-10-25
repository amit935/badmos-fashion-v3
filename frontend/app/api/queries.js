import { gql } from 'graphql-request';

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
