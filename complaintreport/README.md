# Complaint Reporting System

A full-stack web application for reporting and tracking public complaints (road damage, water issues, garbage, streetlights, drainage, etc.).

## Features

✅ **Report Complaints** - Users can submit complaints with photos and details
✅ **Track Status** - Users can track complaint status using complaint ID
✅ **Admin Dashboard** - Manage all complaints, update status, filter & search
✅ **Dark Mode** - Light/dark theme toggle
✅ **Offline Support** - Works without backend (data saved locally)
✅ **Responsive Design** - Works on desktop and mobile

## Tech Stack

**Frontend:** HTML5, CSS3, JavaScript (Vanilla)
**Backend:** Node.js, Express.js
**Database:** MySQL
**Storage:** Base64 image encoding (suitable for prototypes)

## Project Structure

```
complaintreport/
├── index.html          # Home page
├── report.html         # Report complaint form
├── track.html          # Track complaint status
├── login.html          # Admin login
├── admin.html          # Admin dashboard
├── contact.html        # Contact & helpline info
├── script.js           # Frontend logic (all pages)
├── style.css           # Styling
├── server.js           # Express backend server
├── db.sql              # Database schema
├── package.json        # Node.js dependencies
├── .env                # Database credentials (create locally)
├── .env.example        # Template for .env
└── README.md           # This file
```

## Setup Instructions

### 1. Prerequisites

- **Node.js** (v14 or higher) - [Install](https://nodejs.org/)
- **MySQL** (v5.7 or higher) - [Install](https://dev.mysql.com/downloads/)
- A text editor (VS Code recommended)

### 2. Database Setup

1. **Create the database and table:**
   - Open MySQL command line or MySQL Workbench
   - Copy all SQL from `db.sql` and execute it
   - Or run in MySQL:
     ```sql
     mysql -u root -p < db.sql
     ```

2. **Verify database created:**
   ```sql
   USE complaints_db;
   SELECT * FROM complaints;  -- Should be empty
   ```

### 3. Backend Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

   This installs:
   - `express` - Web framework
   - `cors` - Enable cross-origin requests
   - `mysql2` - MySQL client
   - `dotenv` - Load .env variables
   - `nodemon` - Development auto-reload

2. **Configure database connection:**
   - Edit `.env` file with your MySQL credentials:
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASS=your_password
     DB_NAME=complaints_db
     PORT=3000
     ```

3. **Start the backend server:**
   - **Development** (with auto-reload):
     ```bash
     npm run dev
     ```
   - **Production:**
     ```bash
     npm start
     ```
   - Server runs on `http://localhost:3000`

### 4. Frontend Setup

- Open `index.html` in a web browser
- Or serve with a local HTTP server:
  ```bash
  # Using Python 3
  python -m http.server 8000
  
  # Using Python 2
  python -m SimpleHTTPServer 8000
  
  # Using Node.js http-server
  npm install -g http-server
  http-server
  ```

## API Endpoints

All endpoints accept/return JSON. Backend API runs on `http://localhost:3000`

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| POST | `/api/complaints` | Submit new complaint |
| GET | `/api/complaints` | Get all complaints |
| GET | `/api/complaints/:id` | Get complaint by ID |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/complaints/:id/status` | Update status (pending/progress/resolved) |
| DELETE | `/api/complaints/:id` | Delete complaint |

### Example Requests

**Create Complaint:**
```bash
curl -X POST http://localhost:3000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "id": "CMP123456",
    "createdAt": "2025-02-24 10:30:00",
    "name": "John Doe",
    "phone": "9876543210",
    "category": "Road Damage",
    "location": "Main Street, City",
    "description": "Pothole near intersection",
    "status": "pending",
    "photo": null
  }'
```

**Update Status:**
```bash
curl -X PUT http://localhost:3000/api/complaints/CMP123456/status \
  -H "Content-Type: application/json" \
  -d '{"status": "progress"}'
```

## Usage Guide

### For Citizens

1. **Report a Complaint:**
   - Go to [Report](report.html) page
   - Fill in name, phone, category, location, description
   - Optional: Upload a photo
   - Click "Submit Complaint"
   - Save the complaint ID for tracking

2. **Track Complaint:**
   - Go to [Track](track.html) page
   - Enter your complaint ID
   - View current status and details

3. **Toggle Theme:**
   - Click "Theme" button to switch between light/dark mode

### For Admins

1. **Login:**
   - Go to [Login](login.html) page
   - Default credentials:
     - Username: `admin`
     - Password: `admin@123`
   - (Change these in `script.js` for production)

2. **Dashboard:**
   - View all complaints in table format
   - **Search:** By ID, name, phone, or location
   - **Filter:** By category, department, or status
   - **Update Status:** Use dropdown in table
   - **Assign to Staff:** Enter staff member name/ID in "Assigned To" field
   - **Delete:** Click delete button
   - **Logout:** Click logout button

### For Staff Members

1. **Login:**
   - Go to [Staff Portal](staff-login.html)
   - Enter your name or employee ID
   - You'll see all complaints assigned to you

2. **My Dashboard:**
   - View all your assigned complaints
   - **Search:** By ID, complainant name, or location
   - **Filter:** By category or status
   - **Update Status:** Change complaint status directly
   - **Track Progress:** See summary of your pending, in-progress, and resolved tasks
   - **Logout:** Click logout to exit

3. **Workflow:**
   - **Pending:** New task assigned to you
   - **In Progress:** You are currently working on it
   - **Resolved:** Task completed
   - Change status as you progress through your work

## Database Schema

```sql
CREATE TABLE complaints (
  id VARCHAR(32) PRIMARY KEY,           -- Unique complaint ID
  createdAt DATETIME NOT NULL,          -- Creation timestamp
  name VARCHAR(255) NOT NULL,           -- Complainant name
  phone VARCHAR(64) NOT NULL,           -- Contact number
  category VARCHAR(128) NOT NULL,       -- Complaint category
  location VARCHAR(255) NOT NULL,       -- Location/area
  description TEXT NOT NULL,            -- Complaint details
  status VARCHAR(32) DEFAULT 'pending', -- pending/progress/resolved
  photo LONGTEXT,                       -- Base64 encoded image
  INDEX idx_status (status),            -- For fast filtering
  INDEX idx_createdAt (createdAt)       -- For sorting
);
```

## Complaint Categories

- Road Damage
- Water Issue
- Garbage
- Streetlight
- Drainage
- Others

## Complaint Statuses

- **pending** - Newly submitted
- **progress** - Being addressed
- **resolved** - Issue fixed

## Troubleshooting

### Issue: "Cannot GET /api/complaints"
- Backend server is not running
- Solution: `npm run dev` in the project directory

### Issue: "Database error"
- MySQL not running or credentials wrong
- Solution: Check `.env` file and verify MySQL connection

### Issue: "Cannot find module"
- Dependencies not installed
- Solution: Run `npm install`

### Issue: Report page not loading
- Report.html file not in directory
- Solution: Ensure `report.html` exists (case-sensitive)

## Notes

- **Images:** Stored as Base64 in database. For production, use cloud storage (AWS S3)
- **Security:** Frontend admin auth only. Add backend authentication for production
- **Offline Mode:** Data saved to browser localStorage if backend unavailable
- **CORS:** Enabled for localhost:3000 and cross-origin requests

## Future Enhancements

- [ ] Backend admin authentication (JWT)
- [ ] Email notifications for status updates
- [ ] File upload to cloud storage (AWS S3/Google Cloud)
- [ ] Geolocation for automatic location capture
- [ ] Admin dashboard analytics/charts
- [ ] Mobile app (React Native/Flutter)
- [ ] Real-time updates (WebSocket)
- [ ] User account system with email verification

## License

Open source - feel free to modify and use

## Support

For issues or questions, contact: support@complaints.com
Phone: +91 93929 72596
