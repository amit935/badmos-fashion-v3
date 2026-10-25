import { gql } from 'graphql-request';

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
