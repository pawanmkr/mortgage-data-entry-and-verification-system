# Mortgage Data Entry & Verification System

```
   __  ___                 _                    
  /  |/  /___ _____  _____(_)___  ____ _        
 / /|_/ / __ `/ __ \/ ___/ / __ \/ __ `/        
/ /  / / /_/ / / / / /__/ / / / / /_/ /         
/_/  /_/\__,_/_/ /_/\___/_/_/ /_/\__,_/         
```

---

## 📝 Overview

Mortgage Data Entry & Verification System is a robust, full-stack NestJS application designed for secure, efficient, and auditable mortgage record management. It enables admins and virtual assistants (VAs) to upload, assign, verify, and audit mortgage records, with advanced features like encrypted search, batch processing, and automated record locking/unlocking.

---

## 📑 Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Project Index](#project-index)
4. [Quickstart](#quickstart)
5. [Roadmap](#roadmap)
6. [Contribution](#contribution)
7. [License](#license)
8. [Acknowledgements](#acknowledgements)

---

## 🚀 Features

- **Role-based Authentication**: Secure JWT-based login for Admins and VAs.
- **Encrypted Data & Search**: Sensitive fields are encrypted at rest, with HMAC hashes for fast, secure searching.
- **Batch Processing**: Group records into batches for streamlined workflow.
- **TIFF Image Uploads**: Upload and manage TIFF images for each record.
- **Audit Logging**: Every change is tracked for full traceability.
- **Record Locking & Auto-Unlock**: Prevents concurrent edits, with auto-unlock and reassignment after inactivity.
- **Vector Embedding Search**: Semantic search using transformer-based embeddings.
- **Admin Tools**: Assign/unassign records, manage users, and review audit logs.
- **Scheduled Tasks**: Automated background jobs for record management.
- **RESTful API**: Clean, well-structured endpoints for all operations.

---

## 📂 Project Structure

```
mortgage-data/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── auth/           # Authentication & JWT
│   ├── users/          # User management
│   ├── records/        # Mortgage record logic
│   ├── batches/        # Batch processing
│   ├── audit-logs/     # Audit logging
│   ├── images/         # TIFF image handling
│   ├── task/           # Scheduled background jobs
│   ├── common/         # Shared utilities, guards, decorators
│   └── migrations/     # Database migrations
├── uploads/            # Uploaded TIFF files
├── test/               # Unit & e2e tests
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 🗂️ Project Index

- **src/app.module.ts**: Main NestJS module, imports all features.
- **src/auth/**: JWT authentication, login, registration.
- **src/users/**: User entity, roles, and service logic.
- **src/records/**: Record entity, encryption, search, locking, and embedding.
- **src/batches/**: Batch entity and assignment logic.
- **src/audit-logs/**: Audit log entity and service.
- **src/images/**: TIFF upload, download, and listing.
- **src/task/**: Scheduled tasks for auto-unlock and reassignment.
- **src/common/**: Guards, decorators, and middleware.
- **src/seeds/**: Database seeding scripts.
- **test/**: Jest-based unit and integration tests.

---

## ⚡ Quickstart

### 1. Clone & Install

```sh
git clone https://github.com/your-org/mortgage-data.git
cd mortgage-data
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and set:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=mortgage_data
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_64_char_hex_key
```

### 3. Run Database (Docker)

```sh
docker-compose up -d postgres
```

### 4. Run Migrations & Seed Data

```sh
npm run migration:run
npm run seed
```

### 5. Start the App

```sh
npm run start:dev
```

App runs at [http://localhost:3000](http://localhost:3000)

---

## 🛣️ Roadmap

- [x] Secure record encryption & search
- [x] Batch processing & assignment
- [x] Audit logging for all actions
- [x] Automated record locking/unlocking
- [x] Vector embedding search
- [ ] Admin dashboard UI (planned)
- [ ] Advanced analytics & reporting (planned)
- [ ] Multi-tenant support (planned)

---

## 🤝 Contribution

Contributions are welcome! Please:

1. Fork the repo and create your branch.
2. Write clear, tested code.
3. Open a pull request with a detailed description.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [NestJS](https://nestjs.com/) for the backend framework
- [TypeORM](https://typeorm.io/) for ORM
- [pgvector](https://github.com/pgvector/pgvector) for vector search
- [@xenova/transformers](https://github.com/xenova/transformers.js) for embeddings
- All contributors and open-source libraries!

---