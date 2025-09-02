# Quick Deployment Guide

## Option 1: GitHub Pages (Free & Easy)

1. **Create a GitHub Repository**:
   - Go to GitHub and create a new repository
   - Upload all files (`index.html`, `styles.css`, `script.js`, `README.md`)

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "Deploy from a branch" → "main"
   - Your site will be available at `https://yourusername.github.io/repository-name`

3. **Update Script URL**:
   - Edit `script.js` and replace `YOUR_GOOGLE_SCRIPT_URL_HERE` with your Google Apps Script URL

## Option 2: Netlify (Free & Easy)

1. **Drag and Drop**:
   - Go to [netlify.com](https://netlify.com)
   - Drag your project folder to the deploy area
   - Your site will be live instantly

2. **Custom Domain** (Optional):
   - Netlify provides a free subdomain
   - You can add a custom domain in settings

## Option 3: Vercel (Free & Easy)

1. **Import from GitHub**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy automatically

## Option 4: Local Development

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Google Apps Script Setup (Required)

1. **Create Script**:
   - Go to [script.google.com](https://script.google.com)
   - New Project → Paste `google-apps-script.js` content

2. **Create Sheet**:
   - Create Google Sheet → Copy Sheet ID from URL
   - Update `SHEET_ID` in the script

3. **Deploy**:
   - Deploy → New deployment → Web app
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Copy the Web App URL

4. **Update Frontend**:
   - Replace `YOUR_GOOGLE_SCRIPT_URL_HERE` in `script.js` with your Web App URL

## Testing

1. Open your deployed site
2. Fill out the form and submit
3. Check your Google Sheet for the new data
4. Verify the table updates with your entry

That's it! Your health tracker is ready to use! 🎉
