/**
 * Google Apps Script for Daily Health Tracker
 * 
 * This script handles POST requests from the web application,
 * processes health data, and stores it in a Google Sheet.
 * 
 * Setup Instructions:
 * 1. Go to https://script.google.com/
 * 2. Create a new project
 * 3. Replace the default code with this script
 * 4. Create a new Google Sheet and note its ID
 * 5. Update the SHEET_ID constant below
 * 6. Deploy as a web app with execute permissions for "Anyone"
 */

// Configuration - Replace with your Google Sheet ID
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'HealthData';

/**
 * Main function to handle POST requests
 * This function is called when the web app receives a POST request
 */
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Validate the data
    if (!validateHealthData(data)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Invalid data provided'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Store the data in Google Sheets
    const result = storeHealthData(data);
    
    if (result.success) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Health data stored successfully',
          row: result.row
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: result.error
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Internal server error: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for testing or data retrieval)
 */
function doGet(e) {
  try {
    const data = getHealthData();
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: data
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Validate health data
 */
function validateHealthData(data) {
  // Check if all required fields are present
  const requiredFields = ['date', 'weight', 'morningCalories', 'lunchCalories', 'dinnerCalories'];
  
  for (const field of requiredFields) {
    if (!data.hasOwnProperty(field) || data[field] === null || data[field] === undefined) {
      return false;
    }
  }
  
  // Validate data types and ranges
  if (typeof data.weight !== 'number' || data.weight <= 0) {
    return false;
  }
  
  if (typeof data.morningCalories !== 'number' || data.morningCalories < 0) {
    return false;
  }
  
  if (typeof data.lunchCalories !== 'number' || data.lunchCalories < 0) {
    return false;
  }
  
  if (typeof data.dinnerCalories !== 'number' || data.dinnerCalories < 0) {
    return false;
  }
  
  // Validate date format
  if (!isValidDate(data.date)) {
    return false;
  }
  
  return true;
}

/**
 * Check if date string is valid
 */
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Store health data in Google Sheets
 */
function storeHealthData(data) {
  try {
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      // Add headers
      sheet.getRange(1, 1, 1, 6).setValues([
        ['Date', 'Weight (kg)', 'Morning Calories', 'Lunch Calories', 'Dinner Calories', 'Total Calories']
      ]);
      // Format headers
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      sheet.getRange(1, 1, 1, 6).setBackground('#f0f0f0');
    }
    
    // Calculate total calories
    const totalCalories = data.morningCalories + data.lunchCalories + data.dinnerCalories;
    
    // Prepare row data
    const rowData = [
      data.date,
      data.weight,
      data.morningCalories,
      data.lunchCalories,
      data.dinnerCalories,
      totalCalories
    ];
    
    // Append the data to the sheet
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, 6).setValues([rowData]);
    
    // Format the new row
    const newRow = lastRow + 1;
    sheet.getRange(newRow, 1, 1, 6).setBorder(true, true, true, true, true, true);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 6);
    
    return {
      success: true,
      row: newRow
    };
    
  } catch (error) {
    console.error('Error storing health data:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Retrieve health data from Google Sheets
 */
function getHealthData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Skip header row and convert to objects
    const healthData = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      healthData.push({
        date: row[0],
        weight: row[1],
        morningCalories: row[2],
        lunchCalories: row[3],
        dinnerCalories: row[4],
        totalCalories: row[5]
      });
    }
    
    return healthData;
    
  } catch (error) {
    console.error('Error retrieving health data:', error);
    throw error;
  }
}

/**
 * Test function to verify the setup
 */
function testSetup() {
  try {
    // Test spreadsheet access
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    console.log('Spreadsheet access: OK');
    
    // Test sheet creation/access
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      console.log('Sheet created: OK');
    } else {
      console.log('Sheet access: OK');
    }
    
    // Test data storage
    const testData = {
      date: new Date().toISOString().split('T')[0],
      weight: 70.0,
      morningCalories: 400,
      lunchCalories: 600,
      dinnerCalories: 500
    };
    
    const result = storeHealthData(testData);
    if (result.success) {
      console.log('Data storage test: OK');
    } else {
      console.log('Data storage test: FAILED -', result.error);
    }
    
    return 'Setup test completed. Check the logs for results.';
    
  } catch (error) {
    console.error('Setup test failed:', error);
    return 'Setup test failed: ' + error.toString();
  }
}
