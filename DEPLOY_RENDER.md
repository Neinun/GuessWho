# Deploying Guess Who to Render (Free)

This project is now configured so that Render builds the React frontend and runs the Node.js / Socket.io server together under a single URL.

---

### Step 1: Push the `guess-who` folder to GitHub

1. Initialize a git repository inside `guess-who`:
   ```bash
   cd "guess-who"
   git init
   git add .
   git commit -m "Initial commit for Guess Who game"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Link and push your repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Deploy on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and log in (or sign up with your GitHub account).
2. Click **New +** in the top right and select **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your new GitHub repository.
4. Fill in the settings:
   - **Name**: `guess-who` (or any name you like)
   - **Region**: Choose the closest region to you
   - **Branch**: `main`
   - **Root Directory**: Leave blank (or `.` since repository root contains package.json)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Deploy Web Service**!

---

### What happens behind the scenes:
1. Render runs `npm run build`, which installs all dependencies and compiles the React frontend into `client/dist`.
2. Render runs `npm start`, which launches the Node.js Express & Socket.io server.
3. The server serves the React UI, the celebrity images (`/assets`), and handles multiplayer rooms and WebSockets automatically under your free Render URL (e.g., `https://guess-who-xyz.onrender.com`).
