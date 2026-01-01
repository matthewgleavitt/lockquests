// Main app logic for index page - HANDLES BOTH .jpg AND .JPG
(function() {
    const config = window.LOCKQUESTS_CONFIG;
    
    // Check if configured
    if (!config || config.SHEET_ID === 'YOUR_SHEET_ID' || config.API_KEY === 'YOUR_API_KEY') {
        console.log('Please configure your Google Sheet ID and API Key in config.js');
        return;
    }
    
    // Hide setup box, show loading
    document.getElementById('setupBox').style.display = 'none';
    document.getElementById('loadingContainer').style.display = 'block';
    
    // Fetch from Google Sheets
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}/values/${config.SHEET_RANGE}?key=${config.API_KEY}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.values) {
                displayRooms(data.values);
            } else {
                showError('No data found in sheet');
            }
        })
        .catch(error => {
            console.error('Error loading data:', error);
            showError('Error loading data. Check console for details.');
        });
    
    function slugify(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    async function getPhotoUrl(togetherNum, roomName) {
        const numPadded = String(togetherNum).padStart(4, '0');
        const slug = slugify(roomName);
        const baseUrl = `https://matthewgleavitt.github.io/lockquests/photos/${numPadded}-${slug}`;
        
        // Try .jpg first, then .JPG
        const urlJpg = `${baseUrl}.jpg`;
        const urlJPG = `${baseUrl}.JPG`;
        
        // Check if .jpg exists
        try {
            const response = await fetch(urlJpg, { method: 'HEAD' });
            if (response.ok) return urlJpg;
        } catch (e) {}
        
        // Otherwise return .JPG (will fallback to placeholder if doesn't exist)
        return urlJPG;
    }
    
    function displayRooms(sheetData) {
        const headers = sheetData[0];
        const rows = sheetData.slice(1);
        
        // Find column indices
        const colIndices = {
            roomName: headers.indexOf('Room Name'),
            company: headers.indexOf('Company'),
            location: headers.indexOf('Location'),
            state: headers.indexOf('State/Region'),
            date: headers.indexOf('Date'),
            timeLeft: headers.indexOf('Time Left'),
            avgRating: headers.indexOf('Average Rating'),
            togetherNum: headers.indexOf('Together Unique #')
        };
        
        // Filter to together rooms
        const togetherRooms = rows
            .filter(row => row[colIndices.togetherNum])
            .map(row => ({
                roomName: row[colIndices.roomName] || '',
                company: row[colIndices.company] || '',
                location: row[colIndices.location] || '',
                state: row[colIndices.state] || '',
                date: row[colIndices.date] || '',
                timeLeft: row[colIndices.timeLeft] || '',
                avgRating: parseFloat(row[colIndices.avgRating]) || 0,
                togetherNum: parseInt(row[colIndices.togetherNum]) || 0
            }))
            .sort((a, b) => b.togetherNum - a.togetherNum);
        
        // Update count
        document.getElementById('roomCount').textContent = togetherRooms.length;
        
        // Generate HTML
        const html = togetherRooms.map(room => {
            const numPadded = String(room.togetherNum).padStart(4, '0');
            const slug = slugify(room.roomName);
            
            return `
                <a href="room.html?id=${room.togetherNum}" class="room-card">
                    <div class="room-image">
                        <img src="https://matthewgleavitt.github.io/lockquests/photos/${numPadded}-${slug}.jpg" 
                             alt="${room.roomName}"
                             onerror="this.src='https://matthewgleavitt.github.io/lockquests/photos/${numPadded}-${slug}.JPG'; this.onerror=function(){this.style.display='none'; this.parentElement.innerHTML='<div style=\\'position: relative; z-index: 1; text-align: center;\\'><div style=\\'font-family: Bebas Neue, sans-serif; font-size: 2em; opacity: 0.7;\\'>#${numPadded}</div><div style=\\'font-size: 0.9em; margin-top: 10px;\\'>📷 Photo: ${numPadded}-${slug}.jpg</div></div>';};"
                             style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="room-content">
                        <div class="room-title">${room.roomName}</div>
                        <div class="room-company">${room.company}</div>
                        <div class="room-location">${room.location}, ${room.state}</div>
                        <div class="room-rating">★ ${room.avgRating.toFixed(1)} / 5.0</div>
                        <div class="room-meta">
                            <span>📅 ${formatDate(room.date)}</span>
                            <span>⏱️ ${room.timeLeft}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
        
        document.getElementById('roomsGrid').innerHTML = html;
        document.getElementById('loadingContainer').style.display = 'none';
        document.getElementById('roomsContainer').style.display = 'block';
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    function showError(message) {
        document.getElementById('loadingContainer').innerHTML = 
            `<div class="loading"><p>${message}</p></div>`;
    }
    
    // Make slugify available globally
    window.slugify = slugify;
})();
