# ProjectPulse 🚀

A full-stack project evaluation platform built with modern web technologies, designed for users to submit projects, vote on them, and promote featured submissions through integrated payments.

This project was built as a practical full-stack system to explore authentication, role management, payments, and scalable platform architecture.

---

## Features

### Authentication & Authorization
- JWT-based authentication
- Secure password hashing
- Role-based access control
- User roles:
  - Admin
  - User

---

### Project Management
Users can:
- Create and submit projects
- Add title, description, category, and project media
- Track their submitted projects
- Promote projects through featured placement

Admins can:
- Approve or reject submitted projects
- Manage platform content
- Monitor users and activity

---

### Voting System
- One vote per user per project
- Live vote counting
- Ranking projects by popularity
- Duplicate vote prevention

---

### Payment Integration
Integrated with Stripe (test mode)

Users can:
- Feature their project
- Increase project visibility
- Track payment history

---

### Admin Dashboard
Admin panel includes:
- User management
- Project approval workflow
- Payment monitoring
- Platform analytics
- Voting insights

---

## Tech Stack

### Backend
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server / PostgreSQL
- JWT Authentication

### Frontend
- Angular
- TypeScript
- TailwindCSS / Angular Material

### Payments
- Stripe API

### Validation / API
- OpenAPI
- Zod schema generation

---

## Project Structure

```bash
backend/
frontend/
database/
api-spec/
docs/
```

---

## Installation

### Clone repository
```bash
git clone https://github.com/YOUR_USERNAME/ProjectPulse.git
cd ProjectPulse
```

### Backend
```bash
dotnet restore
dotnet run
```

### Frontend
```bash
npm install
ng serve
```

---

## Environment Variables

Create `.env` file:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_secret
STRIPE_SECRET_KEY=your_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

---

## Roadmap
- Notifications system
- Comments & discussions
- AI-powered project scoring
- Public API
- SaaS subscription model

---

## Why I Built This
I wanted to build something beyond a CRUD app — a platform that combines:

- Authentication
- Authorization
- Payments
- Admin management
- Voting logic
- Real-world scalable architecture

This project helped me practice building production-style systems end-to-end.

---

## License
MIT License

---

## Author
Built by Abdulkerim Alfani