# Car Workshop Management System

A robust, production-ready management system for car workshops.

## Features
- **Security:** JWT Authentication with Role-Based Access Control (Admin, Advisor, Mechanic, Accountant).
- **Core Operations:** Customer & Vehicle profiles, Job Order lifecycle tracking.
- **Inventory:** Parts management with stock alerts and consumption tracking.
- **Billing:** Automated invoicing and payment recording.
- **Reporting:** Revenue tracking and mechanic productivity.

## Tech Stack
- **Backend:** Node.js (Express), SQLite.
- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons.

## Setup Instructions

### Backend
1. Go to `backend` folder.
2. Run `npm install`.
3. Create a `.env` file (optional, defaults are provided in code).
4. Run `npm start` to start the server on port 5000.
   - The database will be automatically initialized as `database.sqlite` in the root of the backend folder.
 
### Frontend
1. Go to `frontend` folder.
2. Run `npm install`.
3. Run `npm run dev` to start the development server on port 5173.

## Workflow
1. Login as Admin.
2. Register a Customer and their Vehicle.
3. Create a Job Order for the vehicle.
4. Assign a Mechanic.
5. Record parts used (inventory will automatically deduct).
6. Complete the job and generate an Invoice.
7. Record Payments.
8. View Reports in the Dashboard.
