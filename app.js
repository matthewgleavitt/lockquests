// Main app logic with caching, filters, and search
(function() {
    const config = window.LOCKQUESTS_CONFIG;
    
    // Cache configuration
    const CACHE_KEY = 'lockquests_data';
    const CACHE_TIMESTAMP_KEY = 'lockquests_timestamp';
    const CACHE_VERSION_KEY = 'lockquests_cache_version';
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    const CURRENT_VERSION = '2.0'; // Increment this to force cache refresh
    
    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
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
    
    function getPhotoUrl(togetherNum, roomName) {
        const numPadded = String(togetherNum).padStart(4, '0');
        const slug = slugify(roomName);
        return `photos/${numPadded}-${slug}.jpg`;
    }
    
    function loadData() {
        const cached = getCache();
        if (cached) {
            processData(cached);
        } else {
            console.log('Fetching fresh data from Google Sheets');
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}/values/${config.SHEET_RANGE}?key=${config.API_KEY}`;
            
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.values) {
                        setCache(data.values);
                        processData(data.values);
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
    
    function processData(sheetData) {
        const headers = sheetData[0];
        const rows = sheetData.slice(1);
        
        const roomNameIdx = headers.indexOf('Room Name');
        const companyIdx = headers.indexOf('Company');
        const locationIdx = headers.indexOf('Location');
        const stateIdx = headers.indexOf('State/Region');
        const ratingIdx = headers.indexOf('Average Rating');
        const dateIdx = headers.indexOf('Date');
        const togetherIdx = headers.indexOf('Together Unique #');
        const descriptionIdx = headers.indexOf('Description');
        const genreIdx = headers.indexOf('Genre');
        const themeIdx = headers.indexOf('Theme');
        
        allRooms = [];
        const states = new Set();
        const companies = new Set();
        
        for (const row of rows) {
            if (!row[togetherIdx]) continue;
            
            const togetherNum = parseInt(row[togetherIdx]);
            const roomName = row[roomNameIdx] || 'Unknown Room';
            const company = row[companyIdx] || '';
            const state = row[stateIdx] || '';
            const photoUrl = getPhotoUrl(togetherNum, roomName);
            const genre = row[genreIdx] || '';
            const theme = row[themeIdx] || '';
            
            allRooms.push({
                id: togetherNum,
                name: roomName,
                company: company,
                location: row[locationIdx] || '',
                state: state,
                rating: parseFloat(row[ratingIdx]) || 0,
                date: row[dateIdx] || '',
                photoUrl: photoUrl,
                description: row[descriptionIdx] || '',
                genre: genre,
                theme: theme
            });
            
            if (state) states.add(state);
            if (company) companies.add(company);
        }
        
        // Sort by ID descending
        allRooms.sort((a, b) => b.id - a.id);
        
        // Populate filter dropdowns
        populateFilters(states, companies);
        
        // Update quick stats
        updateQuickStats(allRooms.length, states, companies);
        
        // Apply URL filters or show all
        applyFilters();
        
        document.getElementById('loadingContainer').style.display = 'none';
    }
    
    function populateFilters(states, companies) {
        const stateFilter = document.getElementById('stateFilter');
        const companyFilter = document.getElementById('companyFilter');
        
        // Count rooms per state
        const stateCounts = {};
        states.forEach(state => {
            stateCounts[state] = allRooms.filter(room => room.state === state).length;
        });
        
        // Count rooms per company
        const companyCounts = {};
        companies.forEach(company => {
            companyCounts[company] = allRooms.filter(room => room.company === company).length;
        });
        
        // Populate state filter with counts
        Array.from(states).sort().forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = `${state} (${stateCounts[state]})`;
            stateFilter.appendChild(option);
        });
        
        // Populate company filter with counts
        Array.from(companies).sort().forEach(company => {
            const option = document.createElement('option');
            option.value = company;
            option.textContent = `${company} (${companyCounts[company]})`;
            companyFilter.appendChild(option);
        });
        
        // Check URL parameters
        const params = new URLSearchParams(window.location.search);
        if (params.get('state')) stateFilter.value = params.get('state');
        if (params.get('company')) companyFilter.value = params.get('company');
        if (params.get('rating')) document.getElementById('ratingFilter').value = params.get('rating');
    }
    
    function updateQuickStats(totalRooms, states, companies) {
        document.getElementById('totalRooms').textContent = totalRooms;
        document.getElementById('totalStates').textContent = states.size;
        document.getElementById('totalCompanies').textContent = companies.size;
        
        // Count unique countries from states/regions
        const countryMap = {
            'Attica': 'Greece',
            'Lazio': 'Italy',
            'Bermuda': 'Bermuda',
            'Quebec': 'Canada',
            'Mexico': 'Mexico'
        };
        
        const countries = new Set();
        states.forEach(state => {
            if (countryMap[state]) {
                countries.add(countryMap[state]);
            } else {
                // All other states are US states
                countries.add('United States');
            }
        });
        
        document.getElementById('totalCountries').textContent = countries.size;
    }
    
    function applyFilters() {
        const search = document.getElementById('searchBox').value.toLowerCase();
        const stateFilter = document.getElementById('stateFilter').value;
        const companyFilter = document.getElementById('companyFilter').value;
        const ratingFilter = document.getElementById('ratingFilter').value;
        
        // Check URL for genre/theme filters
        const params = new URLSearchParams(window.location.search);
        const genreFilter = params.get('genre');
        const themeFilter = params.get('theme');
        
        // Debug logging
        if (genreFilter || themeFilter) {
            console.log('Filtering by:', { genreFilter, themeFilter });
            console.log('Sample room genres/themes:', allRooms.slice(0, 3).map(r => ({ name: r.name, genre: r.genre, theme: r.theme })));
        }
        
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
            
            // Genre filter (check if room's genre contains the filter value)
            if (genreFilter && !room.genre.toLowerCase().includes(genreFilter.toLowerCase())) {
                return false;
            }
            
            // Theme filter (check if room's theme contains the filter value)
            if (themeFilter && !room.theme.toLowerCase().includes(themeFilter.toLowerCase())) {
                return false;
            }
            
            return true;
        });
        
        // Debug logging
        if (genreFilter || themeFilter) {
            console.log('Filtered results:', filtered.length);
        }
        
        // Update page title if filtering by genre or theme
        if (genreFilter || themeFilter) {
            const filterName = genreFilter || themeFilter;
            document.title = `${filterName} Rooms - The Lock Quest Monsters`;
        }
        
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
                ? `<img src="${room.photoUrl}" alt="${room.name}" loading="lazy">`
                : `<div class="image-placeholder-text">
                       <div class="image-number">#${String(room.id).padStart(4, '0')}</div>
                       <div>Photo: ${String(room.id).padStart(4, '0')}-${slugify(room.name)}.jpg</div>
                   </div>`;
            
            return `
                <a href="room.html?id=${room.id}" class="room-card">
                    <div class="room-image">${photoHtml}</div>
                    <div class="room-content">
                        <div class="room-title">${room.name}</div>
                        <div class="room-company">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                            </svg>
                            ${room.company}
                        </div>
                        <div class="room-location">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            ${room.location}, ${room.state}
                        </div>
                        ${room.description ? `
                            <hr style="border: none; border-top: 1px solid #3F3B52; margin: 10px 0 0 0;">
                            <div class="room-description">${room.description}</div>
                        ` : '<hr style="border: none; border-top: 1px solid #3F3B52; margin: 10px 0 0 0;">'}
                        <div class="room-meta-pill">
                            <span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 3px;">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                ${room.rating.toFixed(1)}
                            </span>
                            <span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 3px;">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                ${room.date}
                            </span>
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
