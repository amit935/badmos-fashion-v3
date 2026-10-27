import { gql } from 'graphql-request';

export const CART_FRAGMENT = gql`
  fragment Cart on Order {
    id
    code
    state
    totalQuantity
    subTotalWithTax
    totalWithTax
    currencyCode
    lines {
      id
      quantity
      unitPriceWithTax
      linePriceWithTax
      featuredAsset { preview }
      productVariant {
        id
        name
        options { code name }
        product { slug name }
      }
    }
  }
`;