# 🚀 Deployment Guide

This guide will help you deploy your Live Polling System to various hosting platforms.

## 🌐 Hosting Options

### Option 1: Render (Recommended - Free & Easy)

**Step 1: Sign up for Render**
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Click "New +" → "Blueprint"

**Step 2: Connect Repository**
1. Connect your GitHub repository
2. Render will automatically detect the `render.yaml` file
3. Click "Apply" to deploy both backend and frontend

**Step 3: Configure Environment Variables**
- Backend: `NODE_ENV=production`
- Frontend: `REACT_APP_API_URL=https://your-backend-url.onrender.com`

**Step 4: Access Your App**
- Backend: `https://your-backend-name.onrender.com`
- Frontend: `https://your-frontend-name.onrender.com`

### Option 2: Heroku

**Step 1: Install Heroku CLI**
```bash
npm install -g heroku
```

**Step 2: Login and Create App**
```bash
heroku login
heroku create your-app-name
```

**Step 3: Deploy Backend**
```bash
git push heroku main
```

**Step 4: Deploy Frontend**
```bash
cd client
npm run build
heroku static:deploy build
```

### Option 3: Vercel

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Deploy Frontend**
```bash
cd client
vercel
```

**Step 3: Deploy Backend**
```bash
vercel --prod
```

### Option 4: Netlify

**Step 1: Build Frontend**
```bash
cd client
npm run build
```

**Step 2: Deploy to Netlify**
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `client/build` folder
3. Configure environment variables

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-url.com
```

## 📝 Deployment Checklist

- [ ] Environment variables configured
- [ ] CORS settings updated for production
- [ ] Build commands working
- [ ] Static files served correctly
- [ ] Socket.IO connections working
- [ ] API endpoints accessible

## 🚨 Common Issues

### CORS Errors
Update server.js to allow your frontend domain:
```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:3000']
}));
```

### Socket.IO Connection Issues
Ensure the frontend is connecting to the correct backend URL:
```javascript
const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### Build Failures
Check that all dependencies are in package.json:
```bash
npm install
npm run build
```

## 🌍 Production URLs

After deployment, your app will be available at:
- **Frontend**: `https://your-app-name.onrender.com`
- **Backend**: `https://your-backend-name.onrender.com`

## 📞 Support

If you encounter issues:
1. Check the deployment logs
2. Verify environment variables
3. Test locally first
4. Check CORS settings 