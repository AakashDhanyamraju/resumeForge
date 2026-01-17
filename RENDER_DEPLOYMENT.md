# Render Deployment Guide for ResumeForge

## Prerequisites
- GitHub repository: https://github.com/AakashDhanyamraju/resumeForge.git
- Supabase database (already configured)
- Google OAuth credentials (already configured)

## Step-by-Step Deployment

### 1. Create New Web Service on Render

1. Go to https://render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `AakashDhanyamraju/resumeForge`
4. Configure the service:
   - **Name**: `resumeforge` (or your choice)
   - **Environment**: `Docker`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.`

### 2. Set Environment Variables

In the Render dashboard, add these environment variables:

```bash
DATABASE_URL=postgresql://postgres.bofeuhmhuhmsstiegeyp:xO2f21L3VE81r0UP@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

GOOGLE_CLIENT_ID=479939270481-ia2o4h34o7144o80s4ooeg0t6pp23mtf.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET=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

JWT_SECRET=K8jN2pQ9mR5vW7xZ4cF6hL1nS3tY8bV0eG2iJ4kM6oP9qR1sT3uW5xY7zA9bC1dE

SESSION_COOKIE_NAME=resume_session

NODE_ENV=production
```

> **Note**: These values are copied from your `.env` file. Keep them secure!

### 3. Update Google OAuth Redirect URIs

Once deployed, Render will give you a URL like: `https://resumeforge.onrender.com`

Update your Google OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth credentials
3. **Add Authorized Redirect URI**:
   ```
   https://your-app-name.onrender.com/auth/google/callback
   ```
4. Save changes

### 4. Deploy!

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Build the Docker image (takes 5-10 minutes first time)
   - Run migrations automatically
   - Start the application

### 5. Monitor Deployment

Watch the logs in Render dashboard for:
- ✅ `Docker build completed`
- ✅ `Running migrations...`
- ✅ `Server started on port 3000`
- ✅ `Application live at https://your-app.onrender.com`

### 6. Test Your Deployment

1. Visit `https://your-app.onrender.com`
2. Click "Get Started" → "Continue with Google"
3. Sign in with Google
4. Create a resume!

---

## Important Notes

### Free Tier Limitations
- Render's free tier **spins down after 15 minutes of inactivity**
- First request after spin-down takes 30-60 seconds to wake up
- Consider upgrading to paid tier ($7/month) for always-on service

### Database Migrations
Migrations run automatically on deployment via the Dockerfile:
```dockerfile
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run src/server.ts"]
```

### Logs and Debugging
Access logs in Render dashboard:
- **Logs** tab shows real-time application logs
- **Metrics** tab shows CPU, memory, request rates
- **Events** tab shows deployment history

---

## Troubleshooting

### Build Fails
**Error**: `Docker build failed`
- Check Render logs for specific error
- Common issue: Missing dependencies in package.json
- Solution: Ensure all dependencies are committed

### OAuth Redirect Error
**Error**: `redirect_uri_mismatch`
- Check Google Cloud Console redirect URIs
- Must exactly match: `https://your-app.onrender.com/auth/google/callback`
- Case-sensitive!

### Database Connection Error
**Error**: `Can't reach database server`
- Verify `DATABASE_URL` is set correctly in Render
- Check Supabase database is active
- Ensure password is URL-encoded in connection string

### Application Won't Start
**Error**: `Health check failed`
- Check logs for Prisma migration errors
- Verify all environment variables are set
- Check if port 3000 is properly exposed

---

## Post-Deployment

### Custom Domain (Optional)
1. In Render dashboard, go to **Settings** → **Custom Domain**
2. Add your domain (e.g., `resumeforge.com`)
3. Update DNS records as instructed
4. SSL certificate auto-generated

### Environment Updates
To update environment variables:
1. Go to **Environment** tab in Render
2. Update variable
3. Click **Save Changes**
4. Service will auto-redeploy

### Manual Redeployment
To trigger a new deployment:
1. Go to **Manual Deploy** in Render
2. Click **Deploy latest commit**
3. Or push new commit to GitHub (auto-deploys)

---

## Performance Optimization

### Keep Service Alive
Use a cron job to ping your service every 10 minutes:
```bash
# Use a service like cron-job.org
curl https://your-app.onrender.com/health
```

### Database Connection Pooling
Already configured via Supabase connection pooler (port 5432).

### Static Asset Caching
Nginx caching already configured in `nginx.conf`.

---

## Your Deployment URLs

After deployment, update these URLs:

- **Application**: `https://your-app-name.onrender.com`
- **API**: `https://your-app-name.onrender.com/api/*`
- **OAuth Callback**: `https://your-app-name.onrender.com/auth/google/callback`

Good luck with your deployment! 🚀
