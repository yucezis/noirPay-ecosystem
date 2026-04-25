# 🍸 NoirPay | Next-Generation Digital Check and Payment Ecosystem

![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![SignalR](https://img.shields.io/badge/SignalR-0078D4?style=for-the-badge&logo=microsoft&logoColor=white)

Noir is a modern SaaS (Software as a Service) solution that eliminates the "payment chaos" and "waiting for the waiter" in the food and beverage industry, synchronizing everyone's experience at the table in real-time.

*Fast, elegant, and seamless experience.*

---

## 🌟 Project Vision

While socializing in today's cafe and restaurant culture is enjoyable, splitting and paying the bill at a crowded table is equally stressful. Noir digitizes the customer experience by eliminating dependency on physical POS devices and waiters, while providing venue owners with real-time data and operational speed.

## ✨ Key Features

### Customer Experience (Frontend Client)
* **Instant QR Access:** Access the menu in seconds via table QR code without downloading an app.
* **Real-Time Synchronization (SignalR):** Products added to the cart by people at the same table are synchronized across all devices in milliseconds.
* **Smart Split Payment:** Ability to split the total bill equally by number of people or pay only for your selected items (e.g., 1 filter coffee, 1 dessert) and deduct from the check.
* **Modern & Elegant Interface:** Flawless design with Tailwind CSS and shadcn/ui support that can adapt to the venue's aesthetic (dark/light).

### Restaurant/POS Management (Frontend Admin)
* **Centralized Multi-Tenant Architecture:** Ability to manage multiple cafes and branches in isolation through a single system.
* **Live Kitchen/POS Display (KDS):** Real-time notifications that appear on the kitchen screen the moment a customer confirms an order.
* **Dynamic Menu Management:** Instant updates of categories, products, prices, and stock status.

---

## ✨ Architecture and Technology Stack

The project is developed in a **Monorepo** structure adhering to enterprise-standard **Clean Architecture** principles.

### Backend (.NET 8)
* **Core:** Domain-Driven Design (DDD) Entities.
* **Application:** Business logic layer separated using CQRS and MediatR patterns.
* **Infrastructure:** Entity Framework Core (Code-First) and database integrations.
* **Real-Time:** End-to-end instant communication via WebSockets (SignalR).
* **Security:** JWT (JSON Web Token) authentication architecture.

### Frontend Ecosystem (React + Vite)
* **Customer Application:** React + TypeScript for fast response time, Tailwind CSS and shadcn/ui for styling.
* **Admin Panel:** React + TypeScript and Material UI (MUI) for intensive data visualization and operational processes.

---

## 📂 Folder Structure

```text
Noir/
├── backend/                 # .NET 8 Clean Architecture API
│   ├── src/Core/            # Domain & Application Layers
│   ├── src/Infrastructure/  # Database and External Services
│   └── src/API/             # Controllers and SignalR Hub
│
├── frontend_client/         # Customer QR Application (React, Tailwind)
│
└── frontend_admin/          # Restaurant & POS Panel (React, MUI)
```

---

## 🚀 Getting Started (Development Environment)

Follow these steps to run the project on your local machine:

### 1. Backend Setup
```bash
cd backend
dotnet restore
# Add your database connection string to appsettings.json
dotnet ef database update
cd src/API/Noir.API
dotnet run
```

### 2. Running the Customer Interface
```bash
cd frontend_client
npm install
npm run dev
```

### 3. Running the POS/Admin Interface
```bash
cd frontend_admin
npm install
npm run dev
```

---

## ✨ Development Workflow (Git Flow)

This project follows a strict Agile/Jira cycle. Each new feature or fix is developed in isolated task branches opened from the main branch.

**Example Workflow:**

```bash
git checkout -b feature/NOIR-10-database-schema
# ... code development ...
git commit -m "feat(NOIR-10): created database entities"
git push -u origin feature/NOIR-10-database-schema
```

Code is reviewed via Pull Request (PR) on GitHub and merged into the main branch.

---

## ✨ About the Developer

This project is developed and maintained by **Zişan Yüce**.

**Connect with me:**
- 💼 Full-Stack Developer 
- 🌐 Portfolio: [zisan-yuce.vercel.app](https://zisan-yuce.vercel.app/)
- 📧 Email: yucezisan@gmail.com
- 🔗 LinkedIn: [linkedin.com/in/yucezisan](www.linkedin.com/in/zisanyuce)
- 🐙 GitHub: [@yucezis](https://github.com/yucezis)

*Open to collaboration and feedback!*

---

Designed, coded, and lovingly developed as a technology venture. 🖤
