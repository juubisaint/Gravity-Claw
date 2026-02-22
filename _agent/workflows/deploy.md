---
description: how to deploy Gravity Claw to Render.com
---

1. Ensure `render.yaml` and `package.json` are up to date.
2. Push the local code to a GitHub repository.
3. In the Render Dashboard, create a new "Blueprint Instance" from the connected repository.
4. Provide the required environment variables:
   - `DISCORD_BOT_TOKEN`
   - `OPENROUTER_API_KEY`
   - `DATABASE_URL`
   - `ALLOWED_DISCORD_USER_ID`
5. Monitor the logs in Render to ensure the bot connects to Discord and Supabase.
