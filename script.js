// Configuration - Replace with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby2bVKadF5WKvL-K0slD9AuSzZwTx3zi9pVQEEo5mqJSsdOKu-2mVRs0b7nBlIDPbHU/exec';

// DOM Elements
const healthForm = document.getElementById('healthForm');
const messageDiv = document.getElementById('message');
const tableBody = document.getElementById('tableBody');
const refreshBtn = document.getElementById('refreshBtn');
const submitBtn = healthForm.querySelector('.submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoading = submitBtn.querySelector('.btn-loading');
const connectionStatus = document.getElementById('connectionStatus');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // Check connection status
    checkConnectionStatus();
    
    // Load existing data
    loadHealthData();
    
    // Add event listeners
    healthForm.addEventListener('submit', handleFormSubmit);
    refreshBtn.addEventListener('click', loadHealthData);
});

// Check connection status
async function checkConnectionStatus() {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
        showConnectionStatus('offline', '⚠️ Google Apps Script not configured - using local storage');
        return;
    }
    
    showConnectionStatus('checking', '🔄 Checking connection...');
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            showConnectionStatus('online', '✅ Connected to Google Sheets');
        } else {
            showConnectionStatus('offline', '⚠️ Google Sheets unavailable - using local storage');
        }
    } catch (error) {
        showConnectionStatus('offline', '⚠️ Connection failed - using local storage');
    }
}

// Show connection status
function showConnectionStatus(status, message) {
    connectionStatus.className = `connection-status ${status}`;
    connectionStatus.querySelector('.status-text').textContent = message;
    connectionStatus.style.display = 'flex';
    
    // Auto-hide after 5 seconds for success
    if (status === 'online') {
        setTimeout(() => {
            connectionStatus.style.display = 'none';
        }, 5000);
    }
}

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
        
        // Try Google Apps Script first
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                // Use a "simple" Content-Type to avoid CORS preflight (OPTIONS)
                // Apps Script will still receive the JSON string in e.postData.contents
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(healthData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                showMessage('Health data logged to Google Sheets! 🎉', 'success');
                healthForm.reset();
                document.getElementById('date').value = new Date().toISOString().split('T')[0];
                loadHealthData(); // Refresh the table
                return;
            } else {
                throw new Error(result.error || 'Server returned error');
            }
        } catch (fetchError) {
            console.warn('Google Apps Script failed, using local storage:', fetchError);
            showMessage(`Google Sheets unavailable (${fetchError.message}). Using local storage.`, 'warning');
        }
        
        // Fallback to localStorage
        storeHealthData(healthData);
        showMessage('Health data saved locally! 🎉', 'success');
        healthForm.reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        loadHealthData(); // Refresh the table
        
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

// Load health data from localStorage (with Google Sheets fallback)
async function loadHealthData() {
    try {
        // Try to load from localStorage first (always available)
        const storedData = localStorage.getItem('healthData');
        const healthData = storedData ? JSON.parse(storedData) : [];
        
        displayHealthData(healthData);
        
        // Optionally try to sync with Google Sheets in the background
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
            try {
                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'GET',
                    mode: 'cors'
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        // Merge with local data (Google Sheets as source of truth)
                        const mergedData = [...result.data, ...healthData];
                        const uniqueData = mergedData.filter((item, index, self) => 
                            index === self.findIndex(t => t.date === item.date)
                        );
                        localStorage.setItem('healthData', JSON.stringify(uniqueData));
                        displayHealthData(uniqueData);
                    }
                }
            } catch (syncError) {
                console.log('Background sync failed, using local data:', syncError);
            }
        }
        
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

// Store health data in localStorage
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
