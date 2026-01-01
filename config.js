// CONFIGURATION FILE
// Replace these values with your Google Sheets information

const CONFIG = {
    // Your Google Sheet ID (from the URL)
    // Example: https://docs.google.com/spreadsheets/d/ABC123XYZ/edit
    // Your Sheet ID is: ABC123XYZ
    SHEET_ID: '10iKJWSILOwRHidV_YIuMl2b_ovQsZANcRxsUBHpaS0U',
    
    // Your Google API Key
    // Get from: https://console.cloud.google.com/apis/credentials
    API_KEY: 'AIzaSyBVewWmBpnJqLrONPTl3Pjm8Lj0S5M_8jY',
    
    // The sheet name and range to read
    SHEET_RANGE: 'Master List!A:Z'
};

// Don't edit below this line
if (typeof window !== 'undefined') {
    window.LOCKQUESTS_CONFIG = CONFIG;
}
