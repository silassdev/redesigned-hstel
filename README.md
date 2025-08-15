# 🎓 Hostel Management Portal

A full-stack **Next.js 15** application for managing student hostel allocations, payments, and support tickets. Built with **TypeScript**, **Prisma** + PostgreSQL, **NextAuth** for authentication, **Paystack** for payments, and **nodemailer** for receipts.

---

## 🚀 Features

### Public / Main Page
- Particle-effect background with “Student Sign-Up”, “Student Login”, “Forgot Password” and “Admin Login” panels.
- Responsive, accessible, and styled with Tailwind CSS.

### Student
- **Sign-Up** collects: full name, reg-no, phone, email, state, LGA, photo upload, gender, sponsor info, session year, password/confirm.
- **Login** via email or reg-no + password.
- **Dashboard** shows profile + status (room assignment, payment status).
- **Room Requests** list available rooms (filtered by gender), then redirect to Paystack popup.
- **Payments** page lists past payments, payment receipts.
- **Tickets** page: open/close support tickets with subject, message (>20 chars), image upload, threaded replies.

### Admin
- **Invite** new admins by email → unique token email for password-setup.
- **Dashboard** with cards linking to Rooms / Students / Tickets / Logs / Admins / Payments.
- **Rooms**: add blocks+rooms (max 5 per block), specify gender & price; grid view by gender & occupancy; detail modal to view occupants, mark filled/empty, delete.
- **Students**: view list (filter by year/gender/payment/tickets), edit full profile, upload photo, manually set payment, clear room assignment, delete.
- **Tickets**: view open/closed tickets, filter by gender, pagination; reply & close tickets; email notifications.
- **Payments**: search student by name/email/reg-no, mark paid manually (records admin), send PDF receipt, list recent payments, filter & pagination.
- **Session Management**: “Start fresh session” clears room assignments & payment flags, sets new session label.
- **Export Data**: filter by gender/year/payment, download PDF table.
- **Live Logs**: auto-refresh every 10 sec showing API events and errors.
- **Charts**: stacked bar chart showing total vs paid by gender for current session.

---

## 🏗 Architecture & Tech Stack

- **Next.js 15** (App Router, Server & Client Components)
- **TypeScript** end-to-end
- **Tailwind CSS** styling
- **Prisma** ORM with PostgreSQL
- **NextAuth** with Credentials Provider for Admin & Student
- **Paystack** inline for live payments (test mode)
- **nodemailer** + **pdf-lib** for email receipts
- **Recharts** for Session charts
- **html2canvas** + **jsPDF** for PDF export
- Custom **logger** in `/lib/logger` to record API events

---

## 📥 Getting Started

1. **Clone & install**  
   ```bash
   git clone https://github.com/stainpl/hostel-management.git
   cd hostel-management
   npm install