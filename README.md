# Daily Health Tracker

A complete web application for logging daily health data including weight and calorie intake. The application features a clean, responsive interface and automatically stores data in Google Sheets.

## Features

- 📊 **Clean, Modern UI**: Responsive design that works on all devices
- 📝 **Easy Data Entry**: Simple form for logging daily health metrics
- 📈 **Live Data Table**: Real-time display of your health data
- ☁️ **Google Sheets Integration**: Automatic data storage in Google Sheets
- 🔄 **Auto-refresh**: Table updates automatically after new entries
- 📱 **Mobile Friendly**: Optimized for mobile and desktop use

## Data Fields

- **Date**: The date for the health entry
- **Weight**: Your weight in kilograms
- **Morning Calories**: Calories consumed in the morning
- **Lunch Calories**: Calories consumed at lunch
- **Dinner Calories**: Calories consumed at dinner
- **Total Calories**: Automatically calculated total

## Setup Instructions

### 1. Google Apps Script Setup

1. **Create a Google Apps Script Project**:
   - Go to [https://script.google.com/](https://script.google.com/)
   - Click "New Project"
   - Replace the default code with the content from `google-apps-script.js`

2. **Create a Google Sheet**:
   - Go to [https://sheets.google.com/](https://sheets.google.com/)
   - Create a new spreadsheet
   - Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)
   - Update the `SHEET_ID` constant in the Google Apps Script

3. **Deploy the Script**:
   - In Google Apps Script, click "Deploy" → "New deployment"
   - Choose "Web app" as the type
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Click "Deploy"
   - Copy the Web App URL

### 2. Frontend Setup

1. **Update the Script URL**:
   - Open `script.js`
   - Replace `YOUR_GOOGLE_SCRIPT_URL_HERE` with your actual Google Apps Script Web App URL

2. **Host the Files**:
   - Upload `index.html`, `styles.css`, and `script.js` to any web hosting service
   - Popular options: GitHub Pages, Netlify, Vercel, or any web server

### 3. Local Testing (Optional)

You can test the application locally:

1. **Simple HTTP Server**:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

2. **Open in Browser**:
   - Navigate to `http://localhost:8000`
   - The application should load and be ready to use

## File Structure

```
Calorie-Tracker/
├── index.html              # Main HTML file
├── styles.css              # CSS styling
├── script.js               # JavaScript functionality
├── google-apps-script.js   # Google Apps Script backend
└── README.md              # This file
```

## Usage

1. **Log Daily Data**:
   - Fill out the form with today's health data
   - Click "Log Data" to submit
   - You'll see a confirmation message

2. **View Your Data**:
   - The table below the form shows all your logged entries
   - Data is sorted by date (newest first)
   - Total calories are automatically calculated

3. **Refresh Data**:
   - Click the "🔄 Refresh" button to reload data from Google Sheets
   - Data refreshes automatically after new submissions

## Google Sheets Structure

The script automatically creates a sheet with the following columns:

| Date | Weight (kg) | Morning Calories | Lunch Calories | Dinner Calories | Total Calories |
|------|-------------|------------------|----------------|-----------------|----------------|
| 2024-01-15 | 70.5 | 400 | 600 | 500 | 1500 |

## Troubleshooting

### Common Issues

1. **"Error: Failed to log health data"**:
   - Check that your Google Apps Script URL is correct
   - Ensure the script is deployed with "Anyone" access
   - Verify your Google Sheet ID is correct

2. **"CORS error"**:
   - Make sure you're hosting the files on a web server (not opening directly in browser)
   - Check that your Google Apps Script is deployed as a web app

3. **Data not appearing in Google Sheets**:
   - Run the `testSetup()` function in Google Apps Script to verify configuration
   - Check the Google Apps Script execution logs for errors

### Testing the Setup

1. **Test Google Apps Script**:
   - In Google Apps Script, run the `testSetup()` function
   - Check the execution logs for any errors

2. **Test Web App URL**:
   - Open your Google Apps Script Web App URL in a browser
   - You should see a JSON response

## Customization

### Adding New Fields

1. **Update the HTML form** in `index.html`
2. **Update the JavaScript** in `script.js` to handle the new field
3. **Update the Google Apps Script** in `google-apps-script.js` to store the new field
4. **Update the table display** to show the new field

### Styling Changes

- Modify `styles.css` to change colors, fonts, or layout
- The design uses CSS Grid and Flexbox for responsive layout
- Color scheme can be easily customized by changing the CSS variables

## Security Notes

- The Google Apps Script is set to "Anyone" access for simplicity
- For production use, consider implementing authentication
- The script validates all incoming data before storing it
- No sensitive data is stored in the frontend code

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify your Google Apps Script setup
3. Check browser console for JavaScript errors
4. Ensure all files are properly hosted and accessible

---

**Happy Health Tracking! 💪**
