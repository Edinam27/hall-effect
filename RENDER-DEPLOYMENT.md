# Render Deployment Guide for Hall Effect

This guide will help you deploy the Hall Effect gaming controller e-commerce website to Render.

## Prerequisites

1. A Render account (free tier available)
2. Your GitHub repository with the latest code
3. Required API keys and credentials

## Deployment Steps

### 1. Connect Repository to Render

1. Log in to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository: `https://github.com/Edinam27/hall-effect.git`
4. Select the repository and branch (master)

### 2. Configure Service Settings

Render will automatically detect the `render.yaml` file and use these settings:

- **Name**: `hall-effect`
- **Environment**: `Node`
- **Build Command**: `npm install --production`
- **Start Command**: `npm start`
- **Plan**: Free

### 3. Set Environment Variables

In the Render dashboard, add these environment variables:

#### Required Variables
```
NODE_ENV=production
PORT=10000
```

#### Payment Integration
```
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

#### Database (if using external database)
```
DATABASE_URL=your_database_connection_string
```

#### Email Service
```
EMAIL_USER=your_email_username
EMAIL_PASS=your_email_password
```

#### Authentication
```
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Domain Configuration

Your service will be available at: `https://hall-effect.onrender.com`

To use a custom domain:
1. Go to Settings > Custom Domains
2. Add your domain
3. Update DNS records as instructed

### 5. Health Check

The service includes a health check endpoint at `/health` that:
- Checks every 30 seconds
- Times out after 10 seconds
- Marks unhealthy after 3 failed attempts
- Marks healthy after 2 successful attempts

### 6. Static Files

Static files (HTML, CSS, JS, images) are served from the root directory (`./`).

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are listed in `package.json`
   - Ensure Node.js version compatibility (using Node 18)

2. **Environment Variables**
   - Verify all required environment variables are set
   - Check for typos in variable names

3. **Database Connection**
   - Ensure DATABASE_URL is correctly formatted
   - Check database service is running and accessible

4. **Static Files Not Loading**
   - Verify file paths are correct
   - Check that files are included in the repository

### Logs and Monitoring

- View logs in the Render dashboard under "Logs"
- Monitor performance in the "Metrics" tab
- Set up alerts for service downtime

## Post-Deployment

1. Test all functionality:
   - Homepage loads correctly
   - Product pages work
   - Cart functionality
   - Checkout process
   - Payment integration

2. Update DNS (if using custom domain)
3. Set up monitoring and alerts
4. Configure backup strategies

## Support

For issues specific to Render deployment, check:
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)

For application-specific issues, refer to the main README.md file.