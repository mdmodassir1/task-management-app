# TaskFlow - Task Management App

A full-stack task management application with real-time collaboration, drag-and-drop functionality, and team features.

## 🚀 Live Demo

**Frontend:** https://task-management-app.onrender.com *(Coming soon)*

**Test Credentials:**
- Email: modo@gmail.com
- Password: modo@123

## ✨ Features

### Core Features
- User Authentication (JWT)
- Create/Edit/Delete Projects
- Create/Edit/Delete Tasks
- Drag & Drop Kanban Board
- Real-time Updates (Socket.io)

### Team Collaboration
- Add/Remove Team Members
- Task Comments
- Activity Log
- Live Notifications

### Productivity
- Search & Filter Tasks
- Export to PDF/Excel/CSV
- Dark/Light Mode
- Responsive Design

## 🛠️ Tech Stack

**Frontend:** React, Material UI, Socket.io-client, Vite

**Backend:** Node.js, Express, Socket.io, MongoDB

**Deployment:** GitHub, Render

## 📁 Project Structure

task-management-app/
├── backend/ # Node.js + Express API
├── frontend/ # React + Vite App
└── README.md


## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account

### Installation

```bash
# Clone the repository
git clone https://github.com/mdmodassir1/task-management-app.git
cd task-management-app

# Backend setup
cd backend
npm install
cp .env.example .env
# Update .env with your MongoDB URI and JWT secret
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev


👨‍💻 Author
Md Modassir

⭐ Star this repo if you like it!

