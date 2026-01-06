// Main app logic with caching, filters, and search
(function() {
    const config = window.LOCKQUESTS_CONFIG;
    
    // Cache configuration
    const CACHE_KEY = 'lockquests_data';
    const CACHE_TIMESTAMP_KEY = 'lockquests_timestamp';
    const CACHE_VERSION_KEY = 'lockquests_cache_version';
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    const CURRENT_VERSION = '1.0'; // Increment this to force cache refresh
    
    // Check cache version
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (cachedVersion !== CURRENT_VERSION) {
        console.log('Cache version changed, clearing old cache');
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
    }
    
    if (!config || config.SHEET_ID === 'YOUR_SHEET_ID' || config.API_KEY === 'YOUR_API_KEY') {
        console.log('Please configure your Google Sheet ID and API Key in config.js');
        return;
    }
    
    let allRooms = [];
    
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
    
    async function getPhotoUrl(togetherNum, roomName) {
        const numPadded = String(togetherNum).padStart(4, '0');
        const slug = slugify(roomName);
        
        const jpgUrl = `photos/${numPadded}-${slug}.jpg`;
        try {
            const response = await fetch(jpgUrl, { method: 'HEAD' });
            if (response.ok) return jpgUrl;
        } catch (e) {}
        
        const JPGUrl = `photos/${numPadded}-${slug}.JPG`;
        try {
            const response = await fetch(JPGUrl, { method: 'HEAD' });
            if (response.ok) return JPGUrl;
        } catch (e) {}
        
        return null;
    }
    
    async function loadData() {
        const cached = getCache();
        if (cached) {
            await processData(cached);
        } else {
            console.log('Fetching fresh data from Google Sheets');
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}/values/${config.SHEET_RANGE}?key=${config.API_KEY}`;
            
            fetch(url)
                .then(response => response.json())
                .then(async data => {
                    if (data.values) {
                        setCache(data.values);
                        await processData(data.values);
                    } else {
                        showError('No data found in sheet');
                    }
                })
                .catch(error => {
                    console.error('Error loading data:', error);
                    showError('Error loading data. Check console for details.');
                });
        }
    }
    
    async function processData(sheetData) {
        const headers = sheetData[0];
        const rows = sheetData.slice(1);
        
        const roomNameIdx = headers.indexOf('Room Name');
        const companyIdx = headers.indexOf('Company');
        const locationIdx = headers.indexOf('Location');
        const stateIdx = headers.indexOf('State/Region');
        const ratingIdx = headers.indexOf('Average Rating');
        const dateIdx = headers.indexOf('Date');
        const togetherIdx = headers.indexOf('Together Unique #');
        
        allRooms = [];
        const states = new Set();
        const companies = new Set();
        
        for (const row of rows) {
            if (!row[togetherIdx]) continue;
            
            const togetherNum = parseInt(row[togetherIdx]);
            const roomName = row[roomNameIdx] || 'Unknown Room';
            const company = row[companyIdx] || '';
            const state = row[stateIdx] || '';
            const photoUrl = await getPhotoUrl(togetherNum, roomName);
            
            allRooms.push({
                id: togetherNum,
                name: roomName,
                company: company,
                location: row[locationIdx] || '',
                state: state,
                rating: parseFloat(row[ratingIdx]) || 0,
                date: row[dateIdx] || '',
                photoUrl: photoUrl
            });
            
            if (state) states.add(state);
            if (company) companies.add(company);
        }
        
        // Sort by ID descending
        allRooms.sort((a, b) => b.id - a.id);
        
        // Populate filter dropdowns
        populateFilters(states, companies);
        
        // Apply URL filters or show all
        applyFilters();
        
        document.getElementById('loadingContainer').style.display = 'none';
    }
    
    function populateFilters(states, companies) {
        const stateFilter = document.getElementById('stateFilter');
        const companyFilter = document.getElementById('companyFilter');
        
        Array.from(states).sort().forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateFilter.appendChild(option);
        });
        
        Array.from(companies).sort().forEach(company => {
            const option = document.createElement('option');
            option.value = company;
            option.textContent = company;
            companyFilter.appendChild(option);
        });
        
        // Check URL parameters
        const params = new URLSearchParams(window.location.search);
        if (params.get('state')) stateFilter.value = params.get('state');
        if (params.get('company')) companyFilter.value = params.get('company');
        if (params.get('rating')) document.getElementById('ratingFilter').value = params.get('rating');
    }
    
    function applyFilters() {
        const search = document.getElementById('searchBox').value.toLowerCase();
        const stateFilter = document.getElementById('stateFilter').value;
        const companyFilter = document.getElementById('companyFilter').value;
        const ratingFilter = document.getElementById('ratingFilter').value;
        
        const filtered = allRooms.filter(room => {
            // Search
            if (search && !room.name.toLowerCase().includes(search) &&
                !room.company.toLowerCase().includes(search) &&
                !room.location.toLowerCase().includes(search)) {
                return false;
            }
            
            // State
            if (stateFilter && room.state !== stateFilter) return false;
            
            // Company
            if (companyFilter && room.company !== companyFilter) return false;
            
            // Rating
            if (ratingFilter) {
                const minRating = parseFloat(ratingFilter);
                if (room.rating < minRating) return false;
            }
            
            return true;
        });
        
        displayRooms(filtered);
    }
    
    function displayRooms(rooms) {
        const grid = document.getElementById('roomsGrid');
        
        if (rooms.length === 0) {
            grid.innerHTML = '<p style="text-align: center; padding: 40px;">No rooms found matching your filters.</p>';
            return;
        }
        
        grid.innerHTML = rooms.map(room => {
            const photoHtml = room.photoUrl 
                ? `<img src="${room.photoUrl}" alt="${room.name}">`
                : `<div class="image-placeholder-text">
                       <div class="image-number">#${String(room.id).padStart(4, '0')}</div>
                       <div>Photo: ${String(room.id).padStart(4, '0')}-${slugify(room.name)}.jpg</div>
                   </div>`;
            
            return `
                <a href="room.html?id=${room.id}" class="room-card">
                    <div class="room-image">${photoHtml}</div>
                    <div class="room-content">
                        <div class="room-title">${room.name}</div>
                        <div class="room-company">${room.company}</div>
                        <div class="room-location">${room.location}, ${room.state}</div>
                        <div class="room-rating">⭐ ${room.rating.toFixed(1)}</div>
                        <div class="room-meta">
                            <span>📅 ${room.date}</span>
                            <span>#${room.id}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }
    
    function showError(message) {
        const loading = document.getElementById('loadingContainer');
        loading.innerHTML = `<p style="color: #e74c3c;">${message}</p>`;
    }
    
    // Event listeners
    document.getElementById('searchBox').addEventListener('input', applyFilters);
    document.getElementById('stateFilter').addEventListener('change', applyFilters);
    document.getElementById('companyFilter').addEventListener('change', applyFilters);
    document.getElementById('ratingFilter').addEventListener('change', applyFilters);
    
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('searchBox').value = '';
        document.getElementById('stateFilter').value = '';
        document.getElementById('companyFilter').value = '';
        document.getElementById('ratingFilter').value = '';
        window.history.pushState({}, '', window.location.pathname);
        applyFilters();
    });
    
    // Load data
    loadData();
})();
