// Configuration - Replace with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyRRpvFNre__QbEI2yqKfmQFxhjpUwF0TrJ31oTCSe52neSv4Kqex0Eow7M6HwCzPM/exec';

// DOM Elements
const healthForm = document.getElementById('healthForm');
const messageDiv = document.getElementById('message');
const tableBody = document.getElementById('tableBody');
const refreshBtn = document.getElementById('refreshBtn');
const submitBtn = healthForm.querySelector('.submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoading = submitBtn.querySelector('.btn-loading');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // Load existing data
    loadHealthData();
    
    // Add event listeners
    healthForm.addEventListener('submit', handleFormSubmit);
    refreshBtn.addEventListener('click', loadHealthData);
});

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Show loading state
    setLoadingState(true);
    hideMessage();
    
    try {
        // Get form data
        const formData = new FormData(healthForm);
        const healthData = {
            date: formData.get('date'),
            weight: parseFloat(formData.get('weight')),
            morningCalories: parseInt(formData.get('morningCalories')),
            lunchCalories: parseInt(formData.get('lunchCalories')),
            dinnerCalories: parseInt(formData.get('dinnerCalories'))
        };
        
        // Validate data
        if (!validateHealthData(healthData)) {
            throw new Error('Please fill in all fields with valid values');
        }
        
        // Send data to Google Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(healthData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Health data logged successfully! 🎉', 'success');
            healthForm.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            loadHealthData(); // Refresh the table
        } else {
            throw new Error(result.error || 'Failed to log health data');
        }
        
    } catch (error) {
        console.error('Error submitting health data:', error);
        showMessage(`Error: ${error.message}`, 'error');
    } finally {
        setLoadingState(false);
    }
}

// Validate health data
function validateHealthData(data) {
    if (!data.date || !data.weight || !data.morningCalories || !data.lunchCalories || !data.dinnerCalories) {
        return false;
    }
    
    if (data.weight <= 0 || data.morningCalories < 0 || data.lunchCalories < 0 || data.dinnerCalories < 0) {
        return false;
    }
    
    return true;
}

// Set loading state for submit button
function setLoadingState(loading) {
    if (loading) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
    } else {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Show message to user
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideMessage();
        }, 5000);
    }
}

// Hide message
function hideMessage() {
    messageDiv.style.display = 'none';
}

// Load health data from Google Sheets (via Google Apps Script)
async function loadHealthData() {
    try {
        // For now, we'll use localStorage to simulate data storage
        // In a real implementation, you'd fetch from your Google Apps Script
        const storedData = localStorage.getItem('healthData');
        const healthData = storedData ? JSON.parse(storedData) : [];
        
        displayHealthData(healthData);
        
    } catch (error) {
        console.error('Error loading health data:', error);
        showMessage('Error loading health data', 'error');
    }
}

// Display health data in the table
function displayHealthData(data) {
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr class="no-data"><td colspan="6">No data logged yet. Start by submitting your first entry above!</td></tr>';
        return;
    }
    
    // Sort data by date (newest first)
    const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tableBody.innerHTML = sortedData.map(entry => {
        const totalCalories = entry.morningCalories + entry.lunchCalories + entry.dinnerCalories;
        const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${entry.weight} kg</td>
                <td>${entry.morningCalories} cal</td>
                <td>${entry.lunchCalories} cal</td>
                <td>${entry.dinnerCalories} cal</td>
                <td><strong>${totalCalories} cal</strong></td>
            </tr>
        `;
    }).join('');
}

// Simulate data storage (for demo purposes)
// In a real implementation, this would be handled by Google Apps Script
function storeHealthData(data) {
    const existingData = JSON.parse(localStorage.getItem('healthData') || '[]');
    existingData.push(data);
    localStorage.setItem('healthData', JSON.stringify(existingData));
}

// Add some sample data for demonstration
function addSampleData() {
    const sampleData = [
        {
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            weight: 70.5,
            morningCalories: 400,
            lunchCalories: 600,
            dinnerCalories: 500
        },
        {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            weight: 70.3,
            morningCalories: 350,
            lunchCalories: 650,
            dinnerCalories: 450
        }
    ];
    
    localStorage.setItem('healthData', JSON.stringify(sampleData));
    loadHealthData();
}

// Uncomment the line below to add sample data for demonstration
// addSampleData();
