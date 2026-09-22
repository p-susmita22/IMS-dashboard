# Separate Staff & Admin Portals

You requested a separate route for Staff login and Dashboard, so that staff and admins cannot log in to each other's panels.

## Proposed Approach

Instead of rewriting the entire application's internal URLs (like changing `/products` to `/staff/products` across 15+ files), we will create **two distinct entry portals**:

1. **Admin Portal (`/admin`)**
   - A dedicated login page for Admins only.
   - If a Staff member tries to log in here, they will be blocked with an error message: "Access Denied: Admin privileges required."
   - Upon successful Admin login, they are taken to their full-access dashboard.

2. **Staff Portal (`/staff`)**
   - A dedicated login page for Staff only.
   - If an Admin tries to log in here, they will be blocked.
   - Upon successful Staff login, they are taken to their limited operational dashboard.

*Note: The internal application URLs (like `/products`, `/orders`) will remain shared, but access to them is already strictly protected based on whether the logged-in user is an Admin or Staff.*

## Proposed Changes

### [MODIFY] `frontend/src/routes/AppRoutes.jsx`
- Remove the generic `/login` route.
- Add `<Route path="/admin" element={<Login allowedRole="ADMIN" />} />`
- Add `<Route path="/staff" element={<Login allowedRole="STAFF" />} />`
- Redirect any unknown routes (or `/login`) to a choice page or default to `/staff`.

### [MODIFY] `frontend/src/pages/Login.jsx`
- Update the component to accept an `allowedRole` prop.
- Customize the UI title based on the role (e.g., "Staff Portal Login" vs "Admin Portal Login").
- Add validation logic: After authenticating, check if `user.role === allowedRole`. If it doesn't match, instantly log the user out and show an error toast.
- Update the quick-login demo buttons to only show the relevant button for that specific portal.

## User Review Required

> [!IMPORTANT]
> Does this approach meet your requirements? It strictly separates the login process and ensures Staff cannot log in to the Admin panel (and vice versa), while keeping the underlying code clean and maintainable. 

Please click **Proceed** if this plan looks good, or reply with any adjustments you'd like!
