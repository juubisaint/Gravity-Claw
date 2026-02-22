# Gravity Claw Deployment Guide

Follow these steps to get Gravity Claw online 24/7 on Render.com.

## 1. Prepare your GitHub Repository
1.  **Initialize a git repo** (if you haven't already):
    ```bash
    git init
    git add .
    git commit -m "Initial commit - Gravity Claw Cloud Ready"
    ```
2.  **Create a new private repository** on [GitHub](https://github.com/new).
3.  **Push your code**:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git branch -M main
    git push -u origin main
    ```

## 2. Deploy to Render.com
1.  **Login to Render**: [https://dashboard.render.com](https://dashboard.render.com).
2.  **New Blueprint**: Click **"New +"** (top right) and select **"Blueprint"**.
3.  **Connect Repo**: Select your `gravity-claw` repository.
4.  **Configuration**: Render will automatically detect the `render.yaml` file. It will show a list of environment variables you need to fill:
    -   `DISCORD_BOT_TOKEN`: From your Discord Developer Portal.
    -   `ALLOWED_DISCORD_USER_ID`: Your Discord ID.
    -   `OPENROUTER_API_KEY`: Your OpenRouter key.
    -   `DATABASE_URL`: Your Supabase connection string.
5.  **Deploy**: Click **"Apply"**.

## 3. Keep it Active (Optional but Recommended)
Since Render's free tier "sleeps" after 15 minutes of inactivity, use a free monitoring service like **Cron-job.org** or **Better Stack** to ping your bot's heartbeat URL:
`https://gravity-claw.onrender.com/`

This will keep it awake 24/7!
