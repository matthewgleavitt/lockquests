// CONFIGURATION FILE
// Replace these values with your Google Sheets information

const CONFIG = {
    // Your Google Sheet ID (from the URL)
    // Example: https://docs.google.com/spreadsheets/d/ABC123XYZ/edit
    // Your Sheet ID is: ABC123XYZ
    SHEET_ID: '1lY9u3H-WnjciDV21v62yroFCBCkljbyz',
    
    // Your Google API Key
    // Get from: https://console.cloud.google.com/apis/credentials
    API_KEY: 'AIzaSyDMi0EzZqlUEF19jAcsBsdER8E28NaDXOI',
    
    // The sheet name and range to read
    SHEET_RANGE: 'Master List!A:Z'
};

// Don't edit below this line
if (typeof window !== 'undefined') {
    window.LOCKQUESTS_CONFIG = CONFIG;
}
