# RetailFlow-POS-Inventory-System

A full-stack Point of Sale and Inventory Management System for small businesses with multi-tenant data isolation, role-based access, and real-time analytics.

## Project Structure

```
RetailFlow-POS-Inventory-System/
├── retailmaster.client/          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── layouts/
│   ├── package.json
│   └── vite.config.js
│
└── retailmaster.api/             # ASP.NET Core Backend
    ├── Controllers/
    ├── Services/
    ├── Models/
    ├── DTOs/
    ├── Data/
    ├── Program.cs
    └── appsettings.json
```

## Tech Stack

**Backend:** ASP.NET Core 8, PostgreSQL, Entity Framework Core, JWT, BCrypt  
**Frontend:** React 18, Vite, Tailwind CSS, Axios

## Core Features

### Multi-Tenancy
- Complete data isolation via `CompanyId` filtering
- Business owners create company → generate unique **Invite Code**
- Cashiers register using invite code to join company

### Authentication & Roles
- JWT-based authentication
- **Admin:** Full access — manage products, users, inventory
- **Cashier:** POS sales and product viewing only

### Dashboard
- Today's sales, profit, transaction count
- Low stock alerts
- 7-day sales trend chart
- Top selling products
- Live low stock items list

### Inventory Management (Admin)
- Full CRUD with soft delete
- Stock tracking with low stock thresholds
- Profit margin auto-calculation

### Point of Sale
- Product grid with search
- Cart with stock validation
- Discount support
- Transaction-safe processing
- Automatic stock deduction
- Receipt printing

### Company Management (Admin)
- View company details and invite code
- Copy invite code
- Manage team members

## Quick Start

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- PostgreSQL 14+

### Backend Setup
```bash
cd retailmaster.api
# Install DotNetEnv package
dotnet add package DotNetEnv
# Create .env file (see template below)
dotnet ef database update
dotnet run
# API at http://localhost:5235
```

### Frontend Setup
```bash
cd retailmaster.client
# Create .env file (see template below)
npm install
npm run dev
# App at http://localhost:5173
```

## Environment Variables

### Backend `.env` (in `retailmaster.api/`)
```
ConnectionStrings__DefaultConnection=Host=localhost;Database=retailflowdb;Username=postgres;Password=yourpassword
Jwt__Key=your-32-character-min-secret-key-here
Jwt__Issuer=RetailFlowAPI
Jwt__Audience=RetailFlowClient
Cors__AllowedOrigins=http://localhost:5173
```

### Frontend `.env` (in `retailmaster.client/`)
```
VITE_API_BASE_URL=http://localhost:5235/api
```

## First Time Use

| Action | URL | User |
|--------|-----|------|
| Create Company | `/create-company` | Business Owner |
| Register | `/register` | Cashiers (need invite code) |
| Login | `/login` | Everyone |

## Security Features
- BCrypt password hashing
- JWT with embedded `CompanyId` for tenant isolation
- Soft delete on all entities
- Role-based access control
- Secrets excluded via `.gitignore`
