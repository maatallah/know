# Technical Setup Guide: 'Know' Platform Installation

This guide explains how to deploy the "Know" application (which operates as a Full-Stack Next.js application containing both the frontend and backend) on a local server, such as a **Windows Server** or a **QNAP NAS**.

## 1. Prerequisites
- **Node.js**: v18.17 or higher (v20 recommended).
- **PostgreSQL**: v14 or higher.
- **Git**: For pulling deployment repositories (optional but recommended).

---

## 2. "What we have to do at the front end"
Because the platform is built on Next.js, **the frontend and backend are deployed together as a single unit**. You do not need to host a separate frontend repository or configure a frontend-specific web server like Apache/Nginx just to serve static files. 

During the installation process, the command `npm run build` will automatically:
1. Compile the React frontend code.
2. Optimize all images, fonts, and CSS (including the Vintage Theme).
3. Bundle the backend API routes.

Therefore, "Frontend Deployment" is simply the `Build` step of this single setup.

---

## 3. Installation Steps (Universal)

### Step 1: Database Setup
1. Install PostgreSQL on your server (or use the QNAP App Center to install PostgreSQL/Containerized Postgres).
2. Create a new empty database named `know_db`.
3. Create a database user with a secure password and grant them full privileges to `know_db`.

### Step 2: Code & Environment Setup
1. Copy the source code to your server (e.g., `C:\deployments\know-app` on Windows).
2. Create a `.env` file in the root folder with the following variables:

```env
# Database Connection (Replace with actual credentials)
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/know_db?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://YOUR_SERVER_IP:3000"
NEXTAUTH_SECRET="generate-a-random-32-character-string-here"
```

### Step 3: Build and Migrate
Open a terminal (Command Prompt/PowerShell acting as Administrator) in the app directory:

```bash
# 1. Install dependencies
npm install

# 2. Push the database schema
npx prisma db push

# 3. Seed initial data (Creates the first Super Admin)
npm run seed

# 4. Build the Frontend and Backend
npm run build
```

---

## 4. Hosting Configurations

### Option A: Windows Server (Recommended: PM2)
To keep the application running continuously in the background on Windows:

1. Install PM2 globally: `npm install -g pm2`
2. Install PM2 Windows Service: `npm install -g @innocenzi/pm2-windows-service`
3. Start the application:
   ```bash
   pm2 start npm --name "know-app" -- start
   ```
4. Save the PM2 list so it restarts on system reboot:
   ```bash
   pm2 save
   ```
*(Optional: Use IIS as a Reverse Proxy to route traffic over port 80/443 to localhost:3000).*

### Option B: QNAP NAS
QNAPs are excellent minimal-maintenance hosts. You can deploy it using QNAP **Container Station** (Docker).

1. Ensure the QNAP has the **Container Station** app installed.
2. In the project root, ensure you have a standard Next.js `Dockerfile`.
3. Connect via SSH to the QNAP or use the Container Station UI to build and run the Docker image:
   ```bash
   docker build -t know-app .
   docker run -d -p 3000:3000 --name know-service --env-file .env know-app
   ```

## 5. First Login
Once running, navigate to `http://YOUR_SERVER_IP:3000`.
- Log in with the default admin credentials (defined in your `prisma/seed.ts` file).
- Immediately navigate to User Settings/Roles to create your actual manager and technician accounts.
