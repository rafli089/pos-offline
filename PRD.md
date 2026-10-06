# PRD — Offline POS System

| Atribut | Detail |
|---|---|
| **Nama Produk** | Offline POS System |
| **Versi Dokumen** | 1.0.0 — Development Ready |
| **Platform** | Web Application / Desktop-like POS |
| **Mode Utama** | Offline First |
| **Target Bisnis** | Cafe, Coffee Shop, Restaurant, Bakery, Retail Food & Beverage |
| **Bahasa** | Bahasa Indonesia |
| **Mata Uang** | Indonesian Rupiah (IDR / Rp) |

---

## Daftar Isi

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Product Goals](#3-product-goals)
4. [Target User dan Role](#4-target-user-dan-role)
5. [Role Based Access Control](#5-role-based-access-control)
6. [User, Login, Multi-Kasir, dan Terminal](#6-user-login-multi-kasir-dan-terminal)
7. [Business Day dan Shift](#7-business-day-dan-shift)
8. [Ordering dan Transaction](#8-ordering-dan-transaction)
9. [Menu Management](#9-menu-management)
10. [Payment](#10-payment)
11. [Receipt (Struk)](#11-receipt-struk)
12. [Stock dan Inventory](#12-stock-dan-inventory)
13. [Sales dan Reporting](#13-sales-dan-reporting)
14. [Anti-Fraud dan Security](#14-anti-fraud-dan-security)
15. [Offline First](#15-offline-first)
16. [Sync Engine](#16-sync-engine)
17. [Notification dan Utility](#17-notification-dan-utility)
18. [UI dan UX](#18-ui-dan-ux)
19. [Database Architecture](#19-database-architecture)
20. [Core Database Tables](#20-core-database-tables)
21. [Technical Requirements](#21-technical-requirements)
22. [Data Integrity, Performance, dan Backup](#22-data-integrity-performance-dan-backup)
23. [Project Scope](#23-project-scope)
24. [Future Scope](#24-future-scope)
25. [MVP Definition](#25-mvp-definition)
26. [Acceptance Criteria](#26-acceptance-criteria)
27. [Non-Functional Requirements](#27-non-functional-requirements)
28. [Recommended Project Architecture](#28-recommended-project-architecture)
29. [State, Storage, dan Offline Priority](#29-state-storage-dan-offline-priority)
30. [Numbering dan Data Relationship](#30-numbering-dan-data-relationship)
31. [Core Business Rules](#31-core-business-rules)
32. [POS dan Sync Status](#32-pos-dan-sync-status)
33. [Audit dan Transaction Lifecycle](#33-audit-dan-transaction-lifecycle)
34. [Development Priority](#34-development-priority)
35. [Success Metrics](#35-success-metrics)
36. [Final Product Flow](#36-final-product-flow)
37. [Final Scope Summary](#37-final-scope-summary)
38. [Definition of Done](#38-definition-of-done)
39. [Conclusion](#39-conclusion)

---

## 1. Product Overview

### Latar Belakang

POS merupakan sistem utama untuk mengelola menu, pesanan, pembayaran, transaksi, shift kasir, stok, dan laporan.

Project ini membangun **POS Offline** dengan pendekatan **Offline First** agar transaksi penting tetap berjalan tanpa internet dan otomatis tersinkronisasi ketika koneksi tersedia.

---

## 2. Problem Statement

- Transaksi berhenti ketika internet terputus.
- Risiko kehilangan atau duplikasi data transaksi.
- Pengelolaan kasir dan shift belum terkontrol.
- Hak akses user belum terpisah dengan jelas.
- Void, cancel, refund, dan adjustment berisiko disalahgunakan.
- Stok dan laporan sulit dimonitor secara konsisten.
- Monitoring multi-terminal dan multi-outlet membutuhkan struktur data yang jelas.
- Audit trail dan sinkronisasi belum terstruktur.

---

## 3. Product Goals

- Mengelola pesanan, transaksi, penjualan, shift, menu, pembayaran, dan stok.
- Mendukung multi-user, multi-kasir, multi-terminal, dan multi-outlet.
- Tetap dapat bertransaksi ketika offline.
- Sinkronisasi otomatis saat online.
- Mencatat aktivitas penting melalui audit log.
- Mengurangi risiko fraud dan manipulasi transaksi.

---

## 4. Target User dan Role

| Role | Deskripsi |
|---|---|
| **Super Admin** | Mengelola seluruh outlet, user, transaksi, laporan, menu, branch, station, terminal, permission, konfigurasi, dan audit. |
| **Admin POS** | Mengelola menu, harga, stok, kasir, shift, transaksi, payment, dan laporan. |
| **Cashier** | Login, Start Day, Start Shift, starting cash, order, payment, receipt, cancel sesuai permission, Close Shift, dan melihat transaksi sendiri. |
| **Employee** | Akses operasional terbatas sesuai role dan permission. |

---

## 5. Role Based Access Control

### Level Role

| Role | Level |
|---|---|
| Super Admin | 100 |
| Admin POS | 80 |
| Supervisor | 70 |
| Cashier | 50 |
| Employee | 30 |

### Contoh Permission

| Modul | Permission |
|---|---|
| User | `user.view`, `user.create`, `user.update`, `user.delete` |
| Menu | `menu.view`, `menu.create`, `menu.update`, `menu.delete`, `menu.price`, `menu.stock` |
| Order | `order.create`, `order.view`, `order.update`, `order.cancel`, `order.save` |
| Transaction | `transaction.view`, `transaction.cancel`, `transaction.refund`, `transaction.reprint` |
| Payment | `payment.create`, `payment.confirm`, `payment.cancel` |
| Shift | `shift.start`, `shift.close`, `shift.view` |
| Report | `report.sales`, `report.transaction`, `report.payment`, `report.cashier`, `report.shift` |
| Master Data | Branch, station, dan terminal management |
| Audit | `audit.view` |
| Sync | `sync.manage` |
| Business Day | `day.end.override` |

---

## 6. User, Login, Multi-Kasir, dan Terminal

### Login

Login memvalidasi **credential, role, permission, branch, dan terminal**. POS mendukung:

- PIN
- Logout
- Auto-lock
- Multi-user
- Multi-kasir

### Multi-Kasir

```text
Kasir A → Terminal 01 → Shift 001
Kasir B → Terminal 02 → Shift 002
```

### Terminal

Setiap perangkat mempunyai **Terminal ID**, contoh: `POS-TNG-001`.

Terminal digunakan untuk:

- Tracking transaksi
- Audit
- Shift
- Fraud monitoring
- Sinkronisasi
- Identifikasi perangkat

### Station dan Branch

- **Station Management** mendukung Station Kasir, Bar, Kitchen, dan station operasional lain.
- **Branch / Outlet** menyimpan menu, stock, user, station, terminal, dan transaksi.

---

## 7. Business Day dan Shift

Business Day dan Shift **dipisahkan secara tegas**.

- **Business Day** adalah periode operasional outlet.
- **Shift** adalah sesi kerja kasir pada terminal dalam Business Day.
- Satu Business Day dapat memiliki banyak Shift.
- Satu cashier hanya boleh memiliki satu Shift aktif.

### Hierarki

```text
BRANCH
  ↓
BUSINESS DAY
  ↓
SHIFT
  ├── CASHIER
  ├── TERMINAL
  ├── ORDERS
  ├── TRANSACTIONS
  └── PAYMENTS
```

> **Golden Rule**
> Business Day mengontrol apakah **outlet beroperasi**. Shift mengontrol apakah **kasir boleh bertransaksi**.
> Transaction berada di dalam Shift. Shift berada di dalam Business Day. Business Day berada di dalam Branch.

### 7.1 Business Day Status

| Status | Arti |
|---|---|
| `CLOSED` | Belum dimulai |
| `OPEN` | Sedang berjalan |
| `ENDING` | Proses finalisasi |
| `ENDED` | Sudah ditutup |

```text
CLOSED → OPEN → ENDING → ENDED
```

### 7.2 Shift Status

| Status | Arti |
|---|---|
| `NOT_STARTED` | Shift belum dimulai |
| `OPEN` | Shift aktif, transaksi diperbolehkan |
| `CLOSING` | Proses penutupan shift |
| `CLOSED` | Shift sudah ditutup |
| `CANCELLED` | Shift dibatalkan |

```text
Alur normal:
NOT_STARTED → OPEN → CLOSING → CLOSED

Pembatalan penutupan:
CLOSING → OPEN
```

> **Catatan:** Shift `CLOSED` tidak boleh kembali `OPEN`. Jika kasir bekerja kembali, dibuat **Shift baru**.

### 7.3 Start Day

Start Day membuka Business Day.

**Syarat:**

- Business Day masih `CLOSED`.
- User memiliki permission.
- Branch valid.

**Sistem mencatat:** `business_date`, `branch`, `started_by`, `started_at`, dan status `OPEN`.

### 7.4 Start Shift dan Starting Cash

```text
LOGIN
  ↓
START DAY
  ↓
INPUT STARTING CASH
  ↓
START SHIFT
```

- Starting Cash adalah **milik Shift**, bukan Business Day.
- Setelah Shift `OPEN`, starting cash **tidak boleh diedit langsung**.
- Koreksi harus menggunakan permission dan audit.

### 7.5 Transaction Rule

```text
Business Day = OPEN
        AND
Shift = OPEN
        ↓
Transaction Allowed
```

Setiap transaksi menyimpan: **Business Day ID, Shift ID, User ID, Terminal ID, Station ID, dan Branch ID**.

### 7.6 Close Shift

```text
OPEN
  ↓
Close Shift
  ↓
Stop new transaction
  ↓
CLOSING
  ↓
Calculate sales / payment / stock
  ↓
Input Actual Cash
  ↓
Calculate Variance
  ↓
Review
  ↓
Confirm
  ↓
CLOSED
```

Saat `CLOSING`, **tidak boleh ada transaksi atau payment baru**.

**Rumus:**

```text
Expected Cash = Starting Cash + Cash Sales + Cash In − Cash Out − Cash Refund
Variance      = Actual Cash − Expected Cash
```

| Variance Status | Kondisi |
|---|---|
| `BALANCED` | variance = 0 |
| `SHORT` | variance < 0 |
| `OVER` | variance > 0 |

**Close Shift Summary** berisi: cashier, terminal, shift, start/end, jumlah transaksi, gross/net sales, discount, cash sales, digital payments, expected cash, actual cash, dan variance.

### 7.7 Shift Log

```text
SHIFT_CREATED
STARTING_CASH_ENTERED
SHIFT_STARTED
ORDER_CREATED
TRANSACTION_CREATED
PAYMENT_COMPLETED
ITEM_CANCELLED
BILL_CANCELLED
REFUND_CREATED
SHIFT_CLOSING
CASH_COUNTED
SHIFT_CLOSED
```

### 7.8 End Day

- **Close Shift** menutup sesi kasir.
- **End Day** menutup Business Day.

End Day hanya dapat dilakukan jika:

- Semua shift sudah `CLOSED`.
- Tidak ada pending payment.
- Tidak ada `OPEN` order.
- Tidak ada pending transaction.
- Tidak ada critical sync error.
- Tidak ada stock cutting yang belum selesai.

```text
BUSINESS DAY OPEN
  ↓
Check active shifts
  ↓
All shifts closed
  ↓
Sales recap
  ↓
Payment recap
  ↓
Cash recap
  ↓
Stock cutting
  ↓
Sync pending data
  ↓
Final validation
  ↓
Confirm
  ↓
BUSINESS DAY ENDED
```

**Override** menggunakan permission `day.end.override`, alasan, dan audit log.

---

## 8. Ordering dan Transaction

### Fitur

- Book & Order
- Order menu
- Menu category / search
- Quantity & decimal quantity
- Edit quantity
- Notes & notes category
- Cancel item / bill / menu
- Cancel reason
- Save order
- Open price
- Special price
- Multi sales mode
- Visit purpose
- Visitor type
- Sales mode / group
- Guest comment
- Questionnaire

### Order Flow

```text
Create Order → Sales Mode → Menu → Quantity → Modifier/Extra
  → Notes → Price/Discount → Review → Save → Payment → Receipt → Complete
```

### Order Status

| Status | Keterangan |
|---|---|
| `DRAFT` | Order sedang disusun |
| `OPEN` | Order tersimpan dan aktif |
| `PAID` | Order sudah dibayar |
| `CANCELLED` | Order dibatalkan |
| `COMPLETED` | Order selesai |

---

## 9. Menu Management

### Fitur

- Menu satuan
- Menu package / paket
- Menu extra
- Menu modifier
- Menu category
- Menu template
- Menu tag
- Menu recommendation
- Branch menu
- Menu image / display
- Menu stock
- Stock limit
- Normal price
- Special price
- Multi-price
- Open price
- Menu availability

### Availability

| Status | Keterangan |
|---|---|
| `AVAILABLE` | Tersedia |
| `UNAVAILABLE` | Tidak tersedia |
| `OUT_OF_STOCK` | Stok habis |
| `HIDDEN` | Disembunyikan dari tampilan |

### Catatan

- **Modifier** mendukung opsi seperti *Ice* dan *Sugar*.
- **Package** terdiri dari beberapa menu.
- **Tag** dapat berupa: Best Seller, New, Recommended, Promo, Spicy, Vegetarian.

---

## 10. Payment

### Metode Pembayaran

| Kategori | Metode |
|---|---|
| Tunai | Cash |
| QR | QRIS |
| E-Wallet | GoPay, OVO, DANA, ShopeePay, LinkAja, Alipay, WeChat Pay |
| Kartu | VISA, Mastercard, EDC |
| Lainnya | Virtual Account, Digital Payment |

### Fitur

- Multiple Payment
- Payment Tracking
- Payment Confirmation

### Payment Status

| Status | Keterangan |
|---|---|
| `UNPAID` | Belum dibayar |
| `PARTIAL` | Dibayar sebagian |
| `PAID` | Lunas |
| `FAILED` | Gagal |
| `CANCELLED` | Dibatalkan |
| `REFUNDED` | Dikembalikan |

### Contoh Multiple Payment

```text
Total   Rp100.000
Cash    Rp40.000
QRIS    Rp60.000
```

---

## 11. Receipt (Struk)

### Fitur

- Print receipt
- Digital receipt
- WhatsApp receipt
- Email receipt
- Receipt information
- Reprint
- QR pada receipt

### Informasi Minimal pada Receipt

Business Name, Branch, Transaction ID, Date, Cashier, Items, Qty, Price, Discount, Tax, Service, Total, Payment, dan Change.

> **Reprint wajib dicatat.**

---

## 12. Stock dan Inventory

### Fitur

- Stock menu
- Stock limit
- Stock availability
- Branch stock
- Automatic stock update
- End-day cutting stock
- Stock adjustment

### Alur

```text
Transaction Completed
  ↓
Stock Deduction
  ↓
Inventory Updated
```

### Stock Movement Type

`SALE`, `STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`, `WASTE`, `REFUND`, `VOID`

---

## 13. Sales dan Reporting

### Laporan

- Sales recap / report
- Daily / weekly / monthly report
- Transaction report
- Payment report
- Cashier report
- Product / menu report
- Sales mode report
- Outlet report
- Shift report
- Sales analysis
- Profit / Loss
- Automatic sales journal
- Inventory journal

### Dashboard Minimal

| Widget | Widget |
|---|---|
| Today's Sales | Today's Transactions |
| Average Transaction | Cash Sales |
| Digital Sales | Best Seller |
| Low Stock | Active Shift |

---

## 14. Anti-Fraud dan Security

### Monitoring

- Transaction monitoring
- Void monitoring
- Cancel monitoring
- Refund monitoring
- Open Price monitoring
- Special Price monitoring
- Reprint monitoring
- Manual adjustment monitoring
- Cash variance monitoring
- RBAC
- Audit log

### Fraud Detection

Dimulai dari **rule-based** dan dikembangkan menjadi **AI-based**.

**Risk Level:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

### Customer Display (Optional)

Menampilkan item, quantity, price, discount, tax, total, payment amount, dan change.

---

## 15. Offline First

Core POS harus tetap berjalan tanpa internet:

- Cached login
- Menu
- Order
- Edit / cancel sesuai permission
- Cash transaction
- Receipt
- Local stock
- Shift
- Local transaction history

### Alur Data

```text
POS Application
      ↓
Local Database
      ↓
Transaction Queue
      ↓
Internet Available?
     /        \
   NO          YES
    ↓           ↓
Save Local   Sync Server
                ↓
           Confirmation
                ↓
           Mark Synced
```

### Local Data Wajib

User, Role, Permission, Menu, Category, Price, Modifier, Extra, Stock, Branch, Terminal, Station, Business Day, Shift, Orders, Transactions, Payments.

---

## 16. Sync Engine

### Sync Status

`PENDING` → `SYNCING` → `SYNCED` | `FAILED` | `CONFLICT`

### Urutan Sync Saat Online

```text
Deteksi koneksi
  ↓
Pending data
  ↓
Upload transactions
  ↓
Upload payments
  ↓
Upload shift
  ↓
Upload stock changes
  ↓
Server confirmation
  ↓
Mark synced
```

### Aturan

- Conflict **tidak boleh** langsung overwrite data penting.
- Setiap transaksi offline memiliki **unique ID** untuk idempotency dan mencegah duplicate sync.

Contoh ID: `TRX-20261005-POS01-000001`

### Network Indicator

`Online` · `Offline` · `Syncing` · `Sync Error`

---

## 17. Notification dan Utility

- POS notification
- Error report
- Guest comment
- Questionnaire
- Menu recommendation
- QR reinstatement
- Terminal ID
- Station management
- Branch menu
- Employee feature

> Error untuk user harus **mudah dipahami**; detail teknis masuk ke **system log**.

---

## 18. UI dan UX

### Design Direction

Modern, minimalis, clean, smooth, cepat, touch-friendly, keyboard-friendly, dan fokus pada transaksi.

**Inspirasi:** Modern POS + Apple-like simplicity + Restaurant POS efficiency.

### Layout Referensi

```text
┌───────────────────────────────────────────────┐
│ Logo │ Branch │ Shift │ Cashier │ Online ●    │
├───────────────┬───────────────────────────────┤
│ CATEGORY      │ MENU GRID                     │
│ Coffee        │ [Latte] [Americano] [Mocha]   │
│ Non Coffee    │ [Matcha] [Tea] [Chocolate]    │
│ Food          │                               │
├───────────────┴───────────────────────────────┤
│ ORDER CART                                    │
│ Latte x2                          Rp60.000    │
│ Croissant x1                      Rp25.000    │
│ Total                             Rp85.000    │
│ [SAVE]                          [PAYMENT]     │
└───────────────────────────────────────────────┘
```

### Checkout

Checkout harus sederhana:

```text
Subtotal → Discount → Tax → Service → TOTAL → Payment Method → Complete Payment
```

---

## 19. Database Architecture

```text
POS Client
    ↓
SQLite Local DB
    ↓
Sync API
    ↓
PostgreSQL Server
```

| Komponen | Fungsi |
|---|---|
| **PostgreSQL** | Central database |
| **SQLite** | Local database |
| **IndexedDB** | Alternatif local storage untuk web / PWA |

---

## 20. Core Database Tables

```text
users
roles
permissions
role_permissions
branches
stations
terminals
menu_categories
menus
menu_packages
menu_package_items
menu_extras
menu_modifiers
menu_tags
orders
order_items
order_item_modifiers
transactions
payment_methods
payments
business_days
shifts
shift_logs
stocks
stock_movements
sync_queue
audit_logs
```

### 20.1 business_days

| Kolom |
|---|
| `id` |
| `branch_id` |
| `business_date` |
| `started_by` |
| `started_at` |
| `ended_by` |
| `ended_at` |
| `status` |
| `created_at` |
| `updated_at` |

### 20.2 shifts

| Kolom | Kolom |
|---|---|
| `id` | `expected_cash` |
| `business_day_id` | `actual_cash` |
| `branch_id` | `variance` |
| `user_id` | `variance_status` |
| `station_id` | `started_at` |
| `terminal_id` | `closed_at` |
| `status` | `started_by` |
| `starting_cash` | `closed_by` |
| `cash_sales` | `created_at` |
| `cash_in` | `updated_at` |
| `cash_out` | |
| `cash_refund` | |

### 20.3 orders

```text
id, order_number, branch_id, business_day_id, terminal_id,
station_id, user_id, shift_id, sales_mode_id,
visitor_type_id, visit_purpose_id, status, subtotal,
discount, tax, service_charge, total, notes,
created_at, updated_at
```

### 20.4 transactions

```text
id, transaction_number, order_id, branch_id,
business_day_id, terminal_id, station_id, user_id,
shift_id, subtotal, discount, tax, service_charge,
total, status, sync_status, created_at
```

### 20.5 payments

```text
id, transaction_id, payment_method_id, amount,
reference_number, status, confirmed_at
```

### 20.6 stocks

```text
id, branch_id, menu_id, quantity, minimum_quantity, updated_at
```

### 20.7 stock_movements

```text
id, branch_id, menu_id, type, quantity, reference_id, user_id, created_at
```

### 20.8 sync_queue

```text
id, entity_type, entity_id, operation, payload, status,
retry_count, last_error, created_at, synced_at
```

### 20.9 audit_logs

```text
id, user_id, branch_id, terminal_id, action,
entity_type, entity_id, old_data, new_data, ip_address, created_at
```

---

## 21. Technical Requirements

### Frontend

| Teknologi |
|---|
| React |
| TypeScript |
| Vite |
| Tailwind CSS |
| shadcn/ui |
| Lucide React |

**Alternatif:** Next.js + TypeScript + Tailwind CSS + shadcn/ui.

### Backend

| Teknologi |
|---|
| Node.js |
| TypeScript |
| NestJS atau Express |

### Authentication dan Security

- JWT access / refresh token
- Password / PIN hashing
- HTTPS
- RBAC
- Permission checks
- Audit log
- Session expiration
- Secure token storage
- Input validation
- SQL injection protection
- XSS protection
- CSRF protection jika relevan

### API Endpoints

| Method | Endpoint | Modul |
|---|---|---|
| POST | `/api/auth/login` | Auth |
| POST | `/api/auth/logout` | Auth |
| GET | `/api/menu` | Menu |
| POST | `/api/menu` | Menu |
| PUT | `/api/menu/:id` | Menu |
| POST | `/api/orders` | Order |
| GET | `/api/orders` | Order |
| POST | `/api/transactions` | Transaction |
| GET | `/api/transactions` | Transaction |
| POST | `/api/payments` | Payment |
| POST | `/api/business-days/start` | Business Day |
| POST | `/api/business-days/end` | Business Day |
| POST | `/api/shifts/start` | Shift |
| POST | `/api/shifts/close` | Shift |
| POST | `/api/sync` | Sync |
| GET | `/api/sync/status` | Sync |
| GET | `/api/reports/sales` | Report |
| GET | `/api/reports/payment` | Report |
| GET | `/api/reports/cashier` | Report |

---

## 22. Data Integrity, Performance, dan Backup

### Atomic Transaction

```text
Create Order
  ↓
Create Transaction
  ↓
Create Payment
  ↓
Update Stock
  ↓
Create Journal
  ↓
Create Sync Queue
  ↓
COMMIT

Jika gagal → ROLLBACK
```

### Target Performance (Offline)

| Aspek | Target |
|---|---|
| Menu loading | < 1 detik |
| Cart interaction | < 100 ms |
| Search | < 300 ms |
| Local transaction | < 500 ms |

### Keamanan Data Lokal

- Data sensitif harus **encrypted**.
- Data lokal memiliki **expiration policy**.

### Backup

- Backup lokal otomatis.
- Server backup harian.

### Sync Retry

```text
Retry 1 → Retry 2 → Retry 3 → Exponential Backoff → SYNC_ERROR
```

### Export Laporan

CSV, Excel, PDF.

---

## 23. Project Scope

| Phase | Nama | Cakupan |
|---|---|---|
| 1 | Foundation | Authentication, Login/Logout, User, Role, Permission, Branch, Station, Terminal |
| 2 | Shift | Start Day, Starting Cash, Start Shift, Shift Log, Close Shift, End Day, recap |
| 3 | Menu | Menu, Category, Image, Price, Stock, Limit, Extra, Modifier, Package, Tags, Availability |
| 4 | Ordering | Order, Search, Quantity, Decimal Quantity, Notes, Modifier, Extra, Cancel, Save, Open/Special Price, Sales Mode, Visit Purpose, Visitor Type |
| 5 | Payment | Cash, QRIS, E-wallet, Card, EDC, Multiple Payment, Tracking, Confirmation |
| 6 | Receipt | Print, Reprint, Digital, QR, WhatsApp, Email |
| 7 | Stock | Stock, Limit, Deduction, Movement, Cutting, Adjustment |
| 8 | Reporting | Daily/Weekly/Monthly Sales, Transaction, Payment, Cashier, Shift, Product, Sales Mode, Branch, Analysis |
| 9 | Offline & Sync | Local DB, Offline Transaction, Queue, Sync, Retry, Status, Conflict, Recovery |
| 10 | Security | RBAC, Permission, Audit, Transaction Monitoring, Void/Cancel/Refund Monitoring, Variance, Fraud Rules |

---

## 24. Future Scope

- AI Fraud Detection
- Customer Loyalty
- Membership & CRM
- Kitchen Display System
- Self Order & QR Order
- Online Ordering
- Delivery Integration
- Accounting Integration
- Advanced Inventory
- Supplier Management
- Purchase Order
- Recipe / BOM
- Employee Payroll
- Customer Display
- Multi-company
- Advanced Analytics
- Cloud Dashboard
- Mobile Admin

---

## 25. MVP Definition

```text
LOGIN
  ↓
START DAY
  ↓
STARTING CASH
  ↓
START SHIFT
  ↓
CREATE ORDER
  ↓
SELECT MENU
  ↓
EDIT QTY / NOTES
  ↓
CHECKOUT
  ↓
PAYMENT
  ↓
PRINT RECEIPT
  ↓
TRANSACTION COMPLETED
  ↓
STOCK UPDATED
  ↓
SALES UPDATED
  ↓
CLOSE SHIFT
  ↓
SALES RECAP
  ↓
END DAY
  ↓
SYNC
```

---

## 26. Acceptance Criteria

- [ ] **Login:** credential, branch, permission, dan cached credential offline bekerja.
- [ ] **Shift:** Start Day, Starting Cash, Start Shift, Close Shift, variance, dan End Day bekerja.
- [ ] **Ordering:** menu, quantity, notes, modifier, cancel sesuai permission, dan save order bekerja.
- [ ] **Payment:** cash offline, payment record, multiple payment, receipt, dan unique transaction ID bekerja.
- [ ] **Stock:** automatic deduction, low-stock warning, dan stock movement bekerja.
- [ ] **Offline:** transaksi tanpa internet, local storage, sync queue, automatic sync, dan duplicate protection bekerja.
- [ ] **Reporting:** daily sales, transaction, payment, cashier, dan shift report tersedia.

---

## 27. Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| **Performance** | Responsif |
| **Reliability** | Transaksi lokal tidak hilang |
| **Security** | Data user, payment, dan transaction terlindungi |
| **Scalability** | 1 outlet sampai multi-outlet |
| **Maintainability** | Modular, typed, documented, testable, extensible |

---

## 28. Recommended Project Architecture

```text
offline-pos/
├── apps/
│   ├── pos/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── ordering/
│   │   ├── payment/
│   │   ├── business-day/
│   │   ├── shift/
│   │   ├── receipt/
│   │   └── settings/
│   └── admin/
│       ├── users/
│       ├── roles/
│       ├── branches/
│       ├── terminals/
│       ├── menus/
│       ├── inventory/
│       └── reports/
├── server/
│   ├── auth/
│   ├── users/
│   ├── menus/
│   ├── orders/
│   ├── transactions/
│   ├── payments/
│   ├── business-days/
│   ├── shifts/
│   ├── inventory/
│   ├── reports/
│   └── sync/
├── database/
├── shared/
└── docs/PRD.md
```

---

## 29. State, Storage, dan Offline Priority

### Frontend State

User, Auth, Branch, Terminal, Business Day, Shift, Order, Cart, Payment, Menu, Stock, Sync, Network.

**Rekomendasi:** Zustand atau Redux Toolkit.

### Storage

> **Jangan** menyimpan seluruh database POS pada `localStorage`.
> Gunakan **SQLite** atau **IndexedDB**. `localStorage` hanya untuk konfigurasi ringan.

### Prioritas Offline

| Prioritas | Data / Fitur |
|---|---|
| **Critical Offline** | Menu, Price, User, Permission, Business Day, Shift, Order, Payment, Transaction, Stock |
| **Medium** | Reports, customer info, recommendations |
| **Online Preferred** | Cloud analytics, central configuration, AI fraud analysis, external integrations |

---

## 30. Numbering dan Data Relationship

### Format Penomoran

| Entitas | Format | Contoh |
|---|---|---|
| Transaction | `TRX-{YYYYMMDD}-{TERMINAL}-{SEQ}` | `TRX-20261005-POS01-000001` |
| Order | `ORD-{SEQ}` | `ORD-0001` |
| Shift | `SHIFT-{YYYYMMDD}-{SEQ}` | `SHIFT-20261005-001` |

### Relasi Data

```text
BRANCH
├── USERS
├── STATIONS
│   └── TERMINALS
├── MENUS
│   ├── CATEGORY
│   ├── MODIFIER
│   ├── EXTRA
│   └── PACKAGE
├── BUSINESS DAY
│   └── SHIFT
│       └── ORDERS
│           └── TRANSACTIONS
│               └── PAYMENTS
└── STOCK
```

---

## 31. Core Business Rules

1. User tidak dapat transaksi tanpa **Active Shift**.
2. Business Day harus **OPEN** untuk transaksi.
3. Paid transaction **tidak boleh diedit langsung**; gunakan void / refund / adjustment sesuai permission.
4. Cancel **wajib** memiliki reason.
5. Open Price membutuhkan permission.
6. Refund membutuhkan permission.
7. Reprint **wajib dicatat**.
8. Stock berkurang setelah transaction **completed**.
9. Offline transaction **wajib** memiliki unique ID.
10. Sync tidak boleh menghasilkan **duplicate transaction**.
11. Close Shift menghasilkan sales recap.
12. End Day hanya jika semua shift `CLOSED` dan validasi final terpenuhi.
13. Satu cashier hanya boleh memiliki **satu OPEN shift**.
14. Shift `CLOSED` **tidak dapat dibuka kembali**.
15. Terminal aktif tidak boleh diambil alih tanpa close / release yang sah.

---

## 32. POS dan Sync Status

### POS Status

| Status | Keterangan |
|---|---|
| `LOCKED` | POS terkunci (auto-lock / belum login) |
| `READY` | POS siap |
| `BUSINESS_DAY_NOT_STARTED` | Business Day belum dimulai |
| `SHIFT_NOT_STARTED` | Shift belum dimulai |
| `SHIFT_ACTIVE` | Shift aktif |
| `PAYMENT_PROCESSING` | Pembayaran sedang diproses |
| `OFFLINE` | Tanpa koneksi |
| `SYNCING` | Sedang sinkronisasi |
| `SYNC_ERROR` | Error sinkronisasi |

### Sync Indicator

```text
● Online
● Offline — N transaksi menunggu sinkronisasi
↻ Syncing...
⚠ Sync Error
```

---

## 33. Audit dan Transaction Lifecycle

### Contoh Audit Payload

```json
{
  "action": "CANCEL_ITEM",
  "user_id": "USR001",
  "transaction_id": "TRX001",
  "item_id": "ITEM001",
  "reason": "WRONG_ORDER",
  "terminal_id": "POS01",
  "shift_id": "SHIFT001"
}
```

### Transaction Lifecycle

```text
DRAFT
  ↓
OPEN
  ↓
PAYMENT_PENDING
  ↓
PAID
  ↓
COMPLETED
  ↓
SYNC_PENDING
  ↓
SYNCING
  ↓
SYNCED

Failure → SYNC_FAILED
```

---

## 34. Development Priority

| Prioritas | Cakupan |
|---|---|
| **P0 — Critical** | Authentication, Business Day / Shift, Ordering, Payment, Transaction, Offline Storage, Sync |
| **P1 — Important** | Menu Management, Stock, Receipt, Reports, RBAC, Audit Log |
| **P2 — Enhancement** | Recommendation, Questionnaire, Customer Display, Advanced Analytics, Fraud Detection, AI |

---

## 35. Success Metrics

| Kategori | Metrik |
|---|---|
| **Operational** | Kasir dapat transaksi tanpa internet, transaksi cepat, shift akurat |
| **Technical** | Tidak ada duplicate setelah sync, tidak ada transaksi lokal hilang, recovery berhasil |
| **Security** | Permission enforced, void / cancel / refund ter-audit |
| **Business** | Sales / payment reports akurat, stock dan cash variance akurat |

---

## 36. Final Product Flow

```text
LOGIN
  ↓
START DAY
  ↓
STARTING CASH
  ↓
START SHIFT
  ↓
POS DASHBOARD
  ↓
CREATE ORDER
  ↓
SELECT MENU
  ↓
EDIT / NOTES / QTY
  ↓
CHECKOUT
  ↓
PAYMENT
  ↓
RECEIPT
  ↓
TRANSACTION DONE
  ↓
STOCK UPDATE
  ↓
SYNC QUEUE
  ↓
INTERNET AVAILABLE?
     /        \
   NO          YES
    ↓           ↓
LOCAL QUEUE   SYNC
                ↓
             SERVER
                ↓
             SYNCED
                ↓
           CLOSE SHIFT
                ↓
           SALES RECAP
                ↓
            END DAY
```

---

## 37. Final Scope Summary

| Area | Cakupan |
|---|---|
| **Operational Management** | User, Login, Permission, Branch, Station, Terminal, Business Day, Shift, Start Day, End Day |
| **Transaction Management** | Order, Menu, Cart, Modifier, Extra, Notes, Cancel, Void, Payment, Receipt |
| **Inventory** | Stock, Stock Limit, Stock Movement, Availability, End Day Cutting Stock |
| **Business Intelligence** | Sales, Transaction, Payment, Cashier, Shift, Product, Outlet, Analysis |
| **Offline Infrastructure** | Local Database, Offline Transaction, Sync Queue, Automatic Sync, Retry, Conflict Detection, Recovery, Audit Log |

---

## 38. Definition of Done

- [ ] Login / Logout
- [ ] RBAC / Permission
- [ ] Multi-user / Multi-kasir
- [ ] Branch / Station / Terminal
- [ ] Start Day / Starting Cash / Start Shift
- [ ] Order / Menu / Modifier / Extra / Notes
- [ ] Cancel / Void
- [ ] Payment / Multiple Payment
- [ ] Receipt / Reprint
- [ ] Automatic Stock
- [ ] Close Shift / End Day
- [ ] Sales / Payment / Cashier / Shift reports
- [ ] Audit log
- [ ] Offline transaction
- [ ] Local database
- [ ] Sync queue / automatic synchronization
- [ ] Retry / duplicate protection
- [ ] Backup
- [ ] Security validation

---

## 39. Conclusion

Offline POS System dirancang sebagai aplikasi POS **offline-first** yang tidak hanya berfungsi sebagai kasir, tetapi menjadi **sistem operasional utama outlet**. Arsitektur harus memastikan transaksi tetap berjalan tanpa internet dan data disinkronkan saat koneksi tersedia.

**Prinsip utama:**

> **FAST · RELIABLE · OFFLINE-FIRST · SECURE · AUDITABLE · SCALABLE · EASY TO USE**

**Core flow:**

```text
LOGIN → START DAY → STARTING CASH → START SHIFT → ORDER → PAYMENT → RECEIPT
→ STOCK UPDATE → SALES → CLOSE SHIFT → END DAY → SYNC
```