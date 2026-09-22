# StockFlow IMS - Simple Inventory Management System

A complete, production-ready, mobile-first **Simple Inventory Management System** built for wholesale and distribution businesses.

Built with **React.js (Vite) + Tailwind CSS** on the frontend, and **Node.js (Express) + MongoDB (Mongoose)** on the backend.

---

## Key Business Rules Strictly Enforced

1. **No Direct Stock Editing**: Normal users can NEVER directly edit stock numbers.
2. **5 Mandatory Operations**:
   - **ADD STOCK** (`STOCK_IN`)
   - **STOCK OUT** (`STOCK_OUT`)
   - **TRANSFER** (`TRANSFER_IN` / `TRANSFER_OUT`)
   - **RETURN** (`RETURN_GOOD` / `RETURN_DAMAGED`)
   - **STOCK ADJUSTMENT** (`ADJUSTMENT`, requires Manager/Admin approval)
3. **Auditable Movement Trail**: Every single stock operation automatically logs an immutable `StockMovement` audit record.
4. **Oversell Prevention**: Physical and available stock can never drop below zero.
5. **Stock Reservation**: Confirmed wholesale orders reserve stock without reducing physical stock until dispatched.
6. **Damaged Stock Quarantine**: Damaged returns increment `damagedQuantity` and do not re-enter available stock.
7. **Multi-Vendor Independence**: Variant SKUs remain unified across multiple purchasing vendors.

---

## User Roles & Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@ims.com` | `admin123` | Full access, product catalog, vendors, warehouses, user management, system settings. |
| **MANAGER** | `manager@ims.com` | `manager123` | Inventory viewing, stock in/out, order management, transfers, returns, approve adjustments, reports. |
| **STAFF** | `staff@ims.com` | `staff123` | Day-to-day stock in/out, create orders, view products, request adjustments. Restricted from approvals, user management, settings. |

*(1-Click Demo login buttons are provided on the login page!)*

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, React Router DOM, Axios, Context API, Canvas Confetti.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT Authentication, bcryptjs, ExcelJS, PDFKit.
- **Database**: MongoDB (Multi-warehouse collections with compound indexes on `sku`, `barcode`, `variantId + locationId`).

---

## Running the Application

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Running on `mongodb://127.0.0.1:27017`)

### 2. Backend Setup & Startup
```bash
cd backend
npm install
npm run seed       # Seeds initial products, variants, warehouses, vendors & test movements
npm start          # Runs on http://localhost:5000
```

### 3. Frontend Setup & Startup
```bash
cd frontend
npm install
npm run dev        # Runs on http://localhost:5173
```

Open your browser at **`http://localhost:5173`**.

---

## Endpoints Summary

### Auth
- `POST /api/auth/login`: Authenticate and receive JWT
- `GET /api/auth/me`: Get profile of authenticated user

### Products & Variants
- `GET /api/products`: List products with variants and aggregated stock
- `POST /api/products`: Create product and variants with automated SKUs
- `GET /api/products/:id`: Get product details and location-wise stock
- `PUT /api/products/:id`: Update product
- `POST /api/products/:id/variants`: Add variant
- `PUT /api/products/variants/:id`: Update variant details

### Inventory & Stock Operations
- `GET /api/inventory`: List inventory items with stock filters
- `GET /api/inventory/dashboard`: KPI metrics, today's activity, critical alerts
- `GET /api/inventory/search?q=...`: Global search across SKU, Name, Barcode, Size, Colour, Vendor
- `GET /api/inventory/movements`: Audit movement trail
- `GET /api/inventory/:variantId`: Single variant multi-warehouse inventory & history
- `POST /api/inventory/stock-in`: Stock In (Purchase)
- `POST /api/inventory/stock-out`: Stock Out (Sale / Manual Out)

### Orders & Reservations
- `GET /api/orders`: List wholesale orders with status filter
- `POST /api/orders`: Create order in `NEW` status
- `GET /api/orders/:id`: View order details and timeline
- `PATCH /api/orders/:id/status`: Update status (`CONFIRMED` reserves stock, `DISPATCHED` deducts stock, `CANCELLED` releases reservation)

### Transfers, Returns & Adjustments
- `GET /api/transfers`, `POST /api/transfers`: Inter-warehouse stock transfer
- `GET /api/returns`, `POST /api/returns`: Customer returns (`GOOD` vs `DAMAGED`)
- `GET /api/adjustments`, `POST /api/adjustments`: Physical count adjustments
- `PATCH /api/adjustments/:id/approve`: Manager/Admin 1-click approval
- `PATCH /api/adjustments/:id/reject`: Manager/Admin rejection

### Reports & File Exports
- `GET /api/reports/stock`: Stock report (JSON / `?export=excel` / `?export=pdf`)
- `GET /api/reports/sales`: Sales report (JSON / `?export=excel` / `?export=pdf`)
- `GET /api/reports/purchases`: Purchase report (JSON / `?export=excel` / `?export=pdf`)
- `GET /api/reports/movements`: Movement audit report (JSON / `?export=excel` / `?export=pdf`)

### Directory & Management
- `GET /api/vendors`, `POST /api/vendors`, `GET /api/vendors/:id`
- `GET /api/locations`, `POST /api/locations`
- `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id/status`
