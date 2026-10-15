# HR Manager & Salary Analytics System (Final Exam 2026)

**Course:** Internet Programming (Final Exam 2026)  
**Student ID:** `6730202289`  
**Repository Name:** `Std6730202289IPFinal2026`  

---

## 📌 Project Overview
ระบบจัดการข้อมูลพนักงาน (HR Management System) และวิเคราะห์โครงสร้างฐานเงินเดือนในองค์กรด้วย Machine Learning (1D K-Means Clustering) แบ่งออกเป็น 2 ส่วนหลัก:
1. **Phase 1: Authentication & Employee Management (Login & CRUD)**
   - ระบบยืนยันตัวตน (Login) สำหรับผู้ดูแลระบบ
   - ระบบจัดการข้อมูลพนักงาน: เพิ่ม (Create), ดูรายการ (Read), แก้ไขข้อมูล (Update), สลับสถานะ Active <-> On Leave (Toggle Status), และลบข้อมูลพนักงานพร้อมระบบยืนยัน (Delete with Confirmation Alert)
   - ระบบค้นหาพนักงาน (Real-time Search & Filter)
   - ระบบจัดเก็บข้อมูลแบบ Hybrid: รองรับทั้ง In-memory Array ตามสเปกข้อสอบ และเชื่อมโยงฐานข้อมูล MySQL (phpMyAdmin) อัตโนมัติ
2. **Phase 2: Automated Salary Clustering (K-Means Analytics)**
   - อัลกอริทึม 1D K-Means Clustering ($k=3$) บน Backend (Express.js)
   - จัดกลุ่มฐานเงินเดือนออกเป็น 3 ระดับ (Tier 1, Tier 2, Tier 3)
   - Frontend (React Native) แสดงผลการวิเคราะห์ด้วย Summary Cards และ Distribution Bar

---

## 📂 Project Architecture & Directory Structure
โครงสร้างโปรเจกต์จัดวางตามเกณฑ์ข้อกำหนดอย่างเคร่งครัด:

```
Std6730202289IPFinal2026
├── backend                      # Express.js Server
│   ├── database
│   │   ├── employees.sql        # โครงสร้างตารางและ Mock Data สำหรับ phpMyAdmin
│   │   └── ip_std6730202289.sql # Full SQL Dump
│   ├── .env                     # Database & Server configuration
│   ├── package.json
│   └── server.js                # Express Server, CRUD & K-Means endpoints
│
└── frontend                     # React Native (Expo) App
    ├── src
    │   ├── app
    │   │   ├── _layout.tsx      # Navigation & Auth Protection
    │   │   ├── index.tsx        # Dashboard (CRUD UI, Search, ML Cards)
    │   │   ├── login.tsx        # Login Form (admin / password123)
    │   │   ├── add.tsx          # Add Employee Screen
    │   │   ├── edit.tsx         # Edit Employee Screen
    │   │   ├── dashboard.tsx    # Salary Clustering Analytics Screen
    │   │   └── AuthContext.tsx  # Authentication Context
    │   └── constants
    │       └── api.ts           # Centralized API Configuration
    ├── package.json
    └── app.json
```

---

## 🚀 How to Run the Project (วิธีรันโปรเจกต์)

### 1. รัน Backend Server (Node.js / Express)
```bash
cd backend
npm install
npm start
```
*เซิร์ฟเวอร์จะเปิดทำงานที่ `http://localhost:3028`*

### 2. รัน Frontend (React Native / Expo)
```bash
cd frontend
npm install
npm start
```
- กด `w` เพื่อเปิดบน Web Browser (`http://localhost:8081`)
- หรือใช้มือถือเปิด Expo Go เพื่อสแกน QR Code (หากทดสอบบนมือถือให้เปลี่ยน IP ใน `frontend/src/constants/api.ts` เป็น IP ของเครื่องคอมฯ เช่น `10.64.189.206`)

---

## 🔐 Credentials for Login (ข้อมูลเข้าสู่ระบบ)
ตามที่โจทย์ข้อสอบกำหนด:
- **Username:** `admin`
- **Password:** `password123`
*(มีปุ่ม Quick Fill Auto-Fill บนหน้าจอ Login เพื่อความสะดวกรวดเร็วในการตรวจ)*

---

## 📡 API Endpoints Reference

### 1. Authentication
- `POST /api/login`
  - Body: `{"username": "admin", "password": "password123"}`
  - Success (200 OK): `{"success": true, "token": "mock-jwt-token"}`
  - Failure (401 Unauthorized): `{"success": false, "error": "Invalid credentials..."}`

### 2. Employee CRUD
- `GET /api/employees` - เรียกดูรายชื่อพนักงานทั้งหมด (รองรับ `?q=...` ค้นหา)
- `POST /api/employees` - เพิ่มพนักงานใหม่ (Validation 400 Bad Request หากกรอกไม่ครบ)
- `PUT /api/employees/:id/status` - สลับสถานะพนักงาน (Active <-> On Leave)
- `PUT /api/employees/:id` - แก้ไขข้อมูลพนักงาน (ชื่อ, ตำแหน่ง, เงินเดือน, สถานะ)
- `DELETE /api/employees/:id` - ลบพนักงานออกจากระบบ

### 3. K-Means Salary Clustering (Phase 2)
- `GET /api/employees/salary-clusters`
  - ทำการวิเคราะห์ 1D K-Means Clustering ($k=3$) จากเงินเดือนของพนักงานทั้งหมด
  - รูปแบบการตอบกลับ (Response Format):
    ```json
    {
      "success": true,
      "clusters": [
        { "group": "Tier 1", "centroid": 30000, "count": 2 },
        { "group": "Tier 2", "centroid": 50667, "count": 3 },
        { "group": "Tier 3", "centroid": 85000, "count": 1 }
      ]
    }
    ```

---

## 🗄️ Database & Storage (phpMyAdmin / In-Memory)
- **Primary Spec:** ระบบมี In-Memory Mock Employees เริ่มต้น 6 รายการตามโจทย์ข้อสอบ
- **MySQL Integration:** หากเปิด MySQL (ตามข้อมูลใน `.env`) ระบบจะสร้างตาราง `employees` และซิงค์ข้อมูลลงฐานข้อมูล `ip_std6730202289` โดยอัตโนมัติ
- **Fallback Guarantee:** หากไม่เปิด MySQL ระบบจะทำงานต่อผ่าน In-memory mode อย่างสมบูรณ์ 100% ไม่เกิดข้อผิดพลาดหรือ Crash ทำให้กรรมการสามารถรันตรวจผ่านได้ทันที
- **SQL File:** สามารถนำไฟล์ `backend/database/employees.sql` ไป Import บน phpMyAdmin ได้โดยตรง
