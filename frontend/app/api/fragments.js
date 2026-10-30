import { gql } from 'graphql-request';

export const CART_FRAGMENT = gql`
  fragment Cart on Order {
    id
    code
    state
    totalQuantity
    subTotal
    subTotalWithTax
    shipping
    shippingWithTax
    total
    totalWithTax
    currencyCode
    couponCodes
    discounts {
      description
      amount
      amountWithTax
    }
    taxSummary {
      description
      taxRate
      taxBase
      taxTotal
    }
    shippingAddress {
      fullName
      phoneNumber
      streetLine1
      streetLine2
      city
      province
      postalCode
      countryCode
    }
    billingAddress {
      fullName
      phoneNumber
      streetLine1
      streetLine2
      city
      province
      postalCode
      countryCode
    }
    shippingLines {
      priceWithTax
      shippingMethod {
        id
        name
      }
    }
    lines {
      id
      quantity
      unitPriceWithTax
      linePrice
      linePriceWithTax
      featuredAsset {
        preview
      }
      productVariant {
        id
        name
        options {
          code
          name
        }
        product {
          slug
          name
        }
      }
    }
  }
`;