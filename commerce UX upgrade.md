# Shared LMS Commerce UX Upgrade: Direct Buy + Optional Cart + Persisted Wishlist

## Summary
- Ship the same learner commerce UX in `digikatech` and `crossview`.
- Keep cart support for multi-program checkout, but stop forcing every paid purchase through cart.
- Make `Buy Now` the primary paid-program action, keep `Add to Cart` as secondary, add a real persisted wishlist, and hide cart records from routine superadmin use.

## Key Changes
### Checkout and ordering
- Add a checkout preview API that can return either the active cart summary or a direct single-program summary.
- Extend `POST /commerce/orders/` to accept optional `programIds`; when present, create the order from those programs instead of the cart.
- Reuse the most recent unpaid single-program order in direct-buy mode so repeated clicks do not create duplicate abandoned orders.
- Keep the current cart checkout behavior unchanged when `programIds` is not supplied.
- Keep the existing Paystack payment flows and order status handling unchanged for both cart and direct modes.

### Learner UX
- On paid program detail pages, change the primary CTA to `Buy Now`; it should open `/checkout/?mode=direct&programId=<id>` and must not add the program to cart.
- Add a secondary `Add to Cart` action on the same page; it should update the cart badge and show success feedback without redirecting away.
- Keep listing cards preview-first; no inline checkout from cards.
- Change the public header cart icon to open `/cart/` instead of `/checkout/`.
- Add a wishlist icon with count in the public header and a dedicated `/wishlist/` page.
- Replace the current localStorage-only heart behavior with a shared wishlist state layer used by both listing cards and program detail pages.
- The wishlist page should support `Buy Now`, `Add to Cart`, and `Remove`.

### Wishlist design
- Add a `WishlistItem(user, program, created_at)` model with a uniqueness rule on `(user, program)`.
- Do not introduce a transactional `Wishlist` container model; wishlist is saved intent, not checkout state.
- Guests should continue using local storage temporarily.
- On login, sync guest wishlist program IDs into the backend, merge idempotently, then clear the guest cache after a successful sync.

### Admin
- Remove `Cart` and `CartItem` from the default Django admin index.
- Do not add wishlist models to admin in this iteration.
- Keep orders, payments, refunds, access grants, payouts, and revenue views unchanged and visible.

### Shared rollout
- Implement these as shared commerce commits in `digikatech`.
- Cherry-pick the same commerce commits into local `crossview`.
- Keep tenant-specific copy or branding out of the shared commerce commits.

## Public APIs and Interfaces
- Add `GET /commerce/checkout/preview/`
- Query: optional `programIds[]=...`; when omitted, preview the active cart
- Response shape: `{ mode, items, itemCount, totalMinor, currency }`
- Extend `POST /commerce/orders/`
- Existing `{ paymentMethod }` remains valid
- New optional field: `programIds: number[]`
- Add wishlist endpoints:
- `GET /commerce/wishlist/`
- `POST /commerce/wishlist/items/` with `{ programId }`
- `DELETE /commerce/wishlist/items/<program_id>/`
- `POST /commerce/wishlist/sync/` with `{ programIds: number[] }`
- Add a new learner page route: `/wishlist/`
- Add a frontend `WishlistContext` parallel to the existing `CartContext`

## Test Plan
- Backend tests:
- direct checkout preview returns one paid program correctly
- direct checkout rejects unpublished, free, duplicate, or already-owned programs using current commerce validation rules
- `POST /commerce/orders/` with `programIds` creates a direct order and does not mutate the active cart
- direct-buy order reuse prevents duplicate unpaid single-program orders
- existing cart checkout still creates the order from cart and clears/marks cart checked out
- wishlist add/remove/list/sync is idempotent and deduped
- Frontend/manual scenarios:
- paid program detail shows primary `Buy Now` and secondary `Add to Cart`
- `Buy Now` opens checkout for only that program and leaves cart count unchanged
- `Add to Cart` updates the badge and stays on the detail page
- guest wishlist survives reload and syncs into the account after login
- wishlist page actions keep counts and UI state in sync
- card and M-Pesa payments still work in both cart and direct checkout modes
- Verification commands:
- `pytest apps/commerce/tests -q`
- `python manage.py check`
- `npm run build`
- manually verify the shared flow in both repos after cherry-pick

## Assumptions and Defaults
- Both repos should share the same learner purchase UX.
- `Buy Now` should bypass cart entirely.
- Wishlist should be backend-persisted for signed-in users, with local storage used only as a guest bridge.
- Cart stays in the product for optional multi-program checkout, but it is no longer the default path for buying a paid program.
- Superadmin should operate mainly from orders and payments, not from cart records.
