// Room page logic - WITH 10-MINUTE CACHING AND CLICKABLE TAGS
(function() {
    const config = window.LOCKQUESTS_CONFIG;
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = parseInt(urlParams.get('id')) || 1;
    
    // Cache configuration
    const CACHE_KEY = 'lockquests_data';
    const CACHE_TIMESTAMP_KEY = 'lockquests_timestamp';
    const CACHE_VERSION_KEY = 'lockquests_cache_version';
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    const CURRENT_VERSION = '1.1'; // Increment this to force cache refresh
    
    // Check cache version
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (cachedVersion !== CURRENT_VERSION) {
        console.log('Cache version changed, clearing old cache');
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
    }
    
    if (!config || config.SHEET_ID === 'YOUR_SHEET_ID' || config.API_KEY === 'YOUR_API_KEY') {
        document.getElementById('roomDescription').textContent = 
            'Please configure your Google Sheet ID and API Key in config.js';
        return;
    }
    
    function getCache() {
        try {
            const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
            const data = localStorage.getItem(CACHE_KEY);
            
            if (timestamp && data) {
                const age = Date.now() - parseInt(timestamp);
                if (age < CACHE_DURATION) {
                    console.log('Using cached data (age: ' + Math.round(age / 1000) + 's)');
                    return JSON.parse(data);
                }
            }
        } catch (e) {
            console.error('Cache error:', e);
        }
        return null;
    }
    
    function setCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (e) {
            console.error('Error saving cache:', e);
        }
    }
    
    function slugify(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    // Check cache first
    const cached = getCache();
    if (cached) {
        processData(cached);
    } else {
        // Fetch from Google Sheets
        console.log('Fetching fresh data from Google Sheets');
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}/values/${config.SHEET_RANGE}?key=${config.API_KEY}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.values) {
                    setCache(data.values);
                    processData(data.values);
                } else {
                    showError('Room not found');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Error loading room data');
            });
    }
    
    function processData(sheetData) {
        const room = findRoom(sheetData, roomId);
        if (room) {
            updatePage(room);
        } else {
            showError('Room not found');
        }
    }
    
    function findRoom(sheetData, targetId) {
        const headers = sheetData[0];
        const rows = sheetData.slice(1);
        
        // Count total "together" rooms for navigation
        const togetherIdx = headers.indexOf('Together Unique #');
        const totalRooms = rows.filter(row => row[togetherIdx] && row[togetherIdx].trim()).length;
        document.getElementById('navTotal').textContent = totalRooms;
        
        const colIndices = {
            roomName: headers.indexOf('Room Name'),
            company: headers.indexOf('Company'),
            location: headers.indexOf('Location'),
            state: headers.indexOf('State/Region'),
            date: headers.indexOf('Date'),
            timeLeft: headers.indexOf('Time Left'),
            mattRating: headers.indexOf('Matt Rating'),
            mikeRating: headers.indexOf('Mike Rating'),
            avgRating: headers.indexOf('Average Rating'),
            escapees: headers.indexOf('Escapees'),
            together: headers.indexOf('Together Unique #')
        };
        
        for (const row of rows) {
            const id = parseInt(row[colIndices.together]);
            if (id === targetId) {
                return {
                    id: id,
                    name: row[colIndices.roomName] || 'Unknown',
                    company: row[colIndices.company] || '',
                    location: row[colIndices.location] || '',
                    state: row[colIndices.state] || '',
                    date: row[colIndices.date] || '',
                    timeLeft: row[colIndices.timeLeft] || '',
                    mattRating: parseFloat(row[colIndices.mattRating]) || 0,
                    mikeRating: parseFloat(row[colIndices.mikeRating]) || 0,
                    avgRating: parseFloat(row[colIndices.avgRating]) || 0,
                    escapees: row[colIndices.escapees] || ''
                };
            }
        }
        return null;
    }
    
    function updatePage(room) {
        // Update title and meta
        document.title = `${room.name} - Lock Quests`;
        document.getElementById('roomTitle').textContent = room.name;
        document.getElementById('roomCompany').textContent = room.company;
        document.getElementById('roomCompany').href = `index.html?company=${encodeURIComponent(room.company)}`;
        document.getElementById('roomLocation').textContent = `${room.location}, ${room.state}`;
        
        // Update rating
        document.getElementById('overallRating').textContent = room.avgRating.toFixed(1);
        document.getElementById('mattRating').textContent = room.mattRating.toFixed(1);
        document.getElementById('mikeRating').textContent = room.mikeRating.toFixed(1);
        
        // Update rating bars
        document.getElementById('mattBar').style.width = `${(room.mattRating / 5) * 100}%`;
        document.getElementById('mikeBar').style.width = `${(room.mikeRating / 5) * 100}%`;
        
        // Update details
        document.getElementById('detailDate').textContent = room.date;
        document.getElementById('detailTime').textContent = room.timeLeft || 'N/A';
        document.getElementById('detailEscapees').textContent = room.escapees || 'N/A';
        document.getElementById('detailState').textContent = room.state;
        document.getElementById('detailState').href = `index.html?state=${encodeURIComponent(room.state)}`;
        
        // Update tags with clickable links
        const tagsHtml = `
            <a href="index.html?company=${encodeURIComponent(room.company)}" class="tag">${room.company}</a>
            <a href="index.html?state=${encodeURIComponent(room.state)}" class="tag">${room.state}</a>
            <a href="index.html?rating=${room.avgRating.toFixed(1)}" class="tag">⭐ ${room.avgRating.toFixed(1)}</a>
        `;
        document.getElementById('roomTags').innerHTML = tagsHtml;
        
        // Update photo
        const photoContainer = document.getElementById('roomPhoto');
        const numPadded = String(room.id).padStart(4, '0');
        const slug = slugify(room.name);
        
        async function loadPhoto() {
            // Try .jpg first
            let photoUrl = `photos/${numPadded}-${slug}.jpg`;
            try {
                const response = await fetch(photoUrl, { method: 'HEAD' });
                if (!response.ok) {
                    // Try .JPG
                    photoUrl = `photos/${numPadded}-${slug}.JPG`;
                    const response2 = await fetch(photoUrl, { method: 'HEAD' });
                    if (!response2.ok) {
                        photoUrl = null;
                    }
                }
            } catch (e) {
                photoUrl = null;
            }
            
            if (photoUrl) {
                photoContainer.innerHTML = `<img src="${photoUrl}" alt="${room.name}">`;
            } else {
                photoContainer.innerHTML = `
                    <div class="image-placeholder-text">
                        <div class="image-number">#${numPadded}</div>
                        <div>Photo: ${numPadded}-${slug}.jpg</div>
                    </div>
                `;
            }
        }
        loadPhoto();
        
        // Update navigation
        document.getElementById('navNumber').textContent = room.id;
        document.getElementById('prevBtn').href = `room.html?id=${room.id - 1}`;
        document.getElementById('nextBtn').href = `room.html?id=${room.id + 1}`;
        
        if (room.id <= 1) {
            document.getElementById('prevBtn').style.opacity = '0.5';
            document.getElementById('prevBtn').style.pointerEvents = 'none';
        }
    }
    
    function showError(message) {
        document.getElementById('roomDescription').textContent = message;
    }
})();
