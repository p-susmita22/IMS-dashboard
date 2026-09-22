# Separate Portals Implemented

The Staff and Admin portals have been completely separated at the login layer!

## What Changed

### 1. Dedicated Login URLs
- **`/admin`**: The exclusive login page for Admins.
- **`/staff`**: The exclusive login page for Staff members.
- If you go to the old `/login` URL, it automatically redirects you to the Staff portal.

### 2. Strict Access Control
- The login forms now strictly enforce your role.
- If an Admin accidentally tries to log into the `/staff` portal, the system will deny access and show an error immediately.
- Similarly, Staff members cannot use their credentials to log into the `/admin` portal.

### 3. Dynamic UI
- The title of the login page changes dynamically. It will clearly display either **"Admin Portal"** or **"Staff Portal"**.
- The "1-Click Demo Login" buttons have been split up. The Admin portal only shows the Admin demo button, and the Staff portal only shows the Staff demo button.

## How to Test
1. Go to `http://localhost:5173/admin`
2. Notice the "Admin Portal" title. Click the demo button to log in.
3. Log out.
4. Go to `http://localhost:5173/staff`
5. Notice the "Staff Portal" title. Try typing `admin@ims.com` and `admin123` manually to verify that you are blocked from logging in!
