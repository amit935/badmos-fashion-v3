import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCartStore } from '~/store/cart';
import { useAuthStore } from '~/store/auth';
import { ADJUST_ORDER_LINE, ADD_ITEM_TO_ORDER } from '~/api/mutations';
import { GET_ACTIVE_ORDER } from '~/api/queries';

// Replace the real GraphQL client with a fake one
const request = vi.fn();
vi.mock('~/api/client', () => ({
  getClient: () => ({ request }),
}));

const teeSnapshot = {
  variantId: 'V1',
  name: 'Blue Tee',
  image: '',
  options: ['M'],
  path: '/men/tee/blue-tee',
  unitPrice: 49900,
  currencyCode: 'INR',
};

function makeOrder(quantity) {
  return {
    id: 'O1',
    currencyCode: 'INR',
    lines: [
      {
        id: 'L1',
        quantity,
        unitPriceWithTax: 49900,
        featuredAsset: null,
        productVariant: {
          id: 'V1',
          name: 'Blue Tee M',
          options: [{ code: 'm', name: 'M' }],
          product: { slug: 'blue-tee', name: 'Blue Tee' },
        },
      },
    ],
  };
}

let cart;
let auth;

beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
  request.mockReset();
  cart = useCartStore();
  auth = useAuthStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('guest cart', () => {
  it('adds an item and accumulates quantity for the same variant', () => {
    cart.add(teeSnapshot);
    cart.add(teeSnapshot, 2);

    expect(cart.items).toHaveLength(1);
    expect(cart.itemCount).toBe(3);
  });

  it('removes the item when quantity is set to 0', () => {
    cart.add(teeSnapshot);
    cart.setQuantity('V1', 0);

    expect(cart.items).toHaveLength(0);
  });

  it('never calls the Vendure API', () => {
    cart.add(teeSnapshot);
    expect(request).not.toHaveBeenCalled();
  });
});

describe('logged-in cart', () => {
  it('sends only one request for rapid quantity changes', async () => {
    vi.useFakeTimers();
    auth.isAuthenticated = true;
    cart.order = makeOrder(1);
    request.mockResolvedValue({ adjustOrderLine: makeOrder(5) });

    cart.setQuantity('V1', 2);
    cart.setQuantity('V1', 3);
    cart.setQuantity('V1', 5);
    await vi.advanceTimersByTimeAsync(600);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(ADJUST_ORDER_LINE, { lineId: 'L1', quantity: 5 });
  });

  it('shows the new quantity immediately, before the server answers', () => {
    auth.isAuthenticated = true;
    cart.order = makeOrder(1);

    cart.setQuantity('V1', 4);

    expect(cart.items[0].quantity).toBe(4);
  });
});

describe('merge on login', () => {
  it('adds guest items to the Vendure order and empties the guest cart', async () => {
    auth.isAuthenticated = true;
    localStorage.setItem('badmos-guest-cart', JSON.stringify([{ ...teeSnapshot, quantity: 2 }]));

    request.mockImplementation(async (query) => {
      if (query === GET_ACTIVE_ORDER) return { activeOrder: null };
      return { addItemToOrder: makeOrder(2) };
    });

    await cart.mergeGuestCart();

    expect(request).toHaveBeenCalledWith(ADD_ITEM_TO_ORDER, { variantId: 'V1', quantity: 2 });
    expect(cart.guestItems).toHaveLength(0);
    expect(cart.items[0].quantity).toBe(2);
  });
    it('records a rejected line in mergeIssues and still empties the guest cart', async () => {
    auth.isAuthenticated = true;
    localStorage.setItem('badmos-guest-cart', JSON.stringify([{ ...teeSnapshot, quantity: 2 }]));

    request.mockImplementation(async (query) => {
      if (query === GET_ACTIVE_ORDER) return { activeOrder: null };
      return {
        addItemToOrder: { errorCode: 'INSUFFICIENT_STOCK_ERROR', message: 'Not enough stock' },
      };
    });

    await cart.mergeGuestCart();

    expect(cart.mergeIssues).toHaveLength(1);
    expect(cart.mergeIssues[0].name).toBe('Blue Tee');
    expect(cart.guestItems).toHaveLength(0);
  });

  it('keeps guest items for a retry when the network fails', async () => {
    auth.isAuthenticated = true;
    localStorage.setItem('badmos-guest-cart', JSON.stringify([{ ...teeSnapshot, quantity: 2 }]));

    request.mockImplementation(async (query) => {
      if (query === GET_ACTIVE_ORDER) return { activeOrder: null };
      throw new Error('Network down');
    });

    await cart.mergeGuestCart();

    expect(cart.guestItems).toHaveLength(1);
  });
});