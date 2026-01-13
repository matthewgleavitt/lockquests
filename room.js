// Room page logic - WITH CLICKABLE TAGS
(function() {
    const config = window.LOCKQUESTS_CONFIG;
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = parseInt(urlParams.get('id')) || 1;
    
    if (!config || config.SHEET_ID === 'YOUR_SHEET_ID' || config.API_KEY === 'YOUR_API_KEY') {
        document.getElementById('roomDescription').textContent = 
            'Please configure your Google Sheet ID and API Key in config.js';
        return;
    }
    
    function slugify(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    // Fetch from Google Sheets
    console.log('Fetching data from Google Sheets');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}/values/${config.SHEET_RANGE}?key=${config.API_KEY}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.values) {
                processData(data.values);
            } else {
                showError('Room not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Error loading room data');
        });
    
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
            together: headers.indexOf('Together Unique #'),
            description: headers.indexOf('Description'),
            genre: headers.indexOf('Genre'),
            theme: headers.indexOf('Theme')
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
                    escapees: row[colIndices.escapees] || '',
                    description: row[colIndices.description] || '',
                    genre: row[colIndices.genre] || '',
                    theme: row[colIndices.theme] || '',
                    totalRooms: totalRooms
                };
            }
        }
        return null;
    }
    
    function updatePage(room) {
        // Update title and meta
        const pageTitle = `${room.name} - ${room.company} | The Lock Quest Monsters`;
        const pageDescription = room.description 
            ? `Rated ${room.avgRating.toFixed(1)}/5 - ${room.description.substring(0, 140)}...` 
            : `Rated ${room.avgRating.toFixed(1)}/5 - ${room.name} at ${room.company} in ${room.location}, ${room.state}.`;
        
        document.title = pageTitle;
        
        // Update meta description
        const metaDesc = document.getElementById('metaDescription');
        if (metaDesc) metaDesc.setAttribute('content', pageDescription);
        
        // Update Open Graph tags
        const ogTitle = document.getElementById('ogTitle');
        if (ogTitle) ogTitle.setAttribute('content', pageTitle);
        const ogDesc = document.getElementById('ogDescription');
        if (ogDesc) ogDesc.setAttribute('content', pageDescription);
        
        // Update Twitter tags
        const twitterTitle = document.getElementById('twitterTitle');
        if (twitterTitle) twitterTitle.setAttribute('content', pageTitle);
        const twitterDesc = document.getElementById('twitterDescription');
        if (twitterDesc) twitterDesc.setAttribute('content', pageDescription);
        
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
        
        // Update details (only the fields that still exist)
        document.getElementById('detailDate').textContent = room.date;
        document.getElementById('detailTime').textContent = room.timeLeft || 'N/A';
        document.getElementById('detailEscapees').textContent = room.escapees || 'N/A';
        
        // Update tags with clickable links
        // Build genre tags (can have multiple separated by comma)
        const genreTags = room.genre ? room.genre.split(',').map(g => g.trim()).filter(g => g).map(g => `
            <a href="/?genre=${encodeURIComponent(g)}" class="tag tag-genre">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 5px;">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                ${g}
            </a>
        `).join('') : '';
        
        // Build theme tags (can have multiple separated by comma)
        const themeTags = room.theme ? room.theme.split(',').map(t => t.trim()).filter(t => t).map(t => `
            <a href="/?theme=${encodeURIComponent(t)}" class="tag tag-theme">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 5px;">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                ${t}
            </a>
        `).join('') : '';
        
        const tagsHtml = `
            <a href="/?company=${encodeURIComponent(room.company)}" class="tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 5px;">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
                ${room.company}
            </a>
            <a href="/?state=${encodeURIComponent(room.state)}" class="tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 5px;">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
                ${room.state}
            </a>
            <a href="/?rating=${room.avgRating.toFixed(1)}" class="tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 5px;">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                ${room.avgRating.toFixed(1)}
            </a>
            ${genreTags}
            ${themeTags}
        `;
        document.getElementById('roomTags').innerHTML = tagsHtml;
        
        // Update description
        const descElement = document.getElementById('roomDescription');
        if (room.description) {
            descElement.textContent = room.description;
        } else {
            descElement.textContent = 'No description available.';
        }
        
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
        
        // Disable Previous button on first room
        if (room.id <= 1) {
            document.getElementById('prevBtn').style.opacity = '0.5';
            document.getElementById('prevBtn').style.pointerEvents = 'none';
        }
        
        // Disable Next button on last room
        if (room.id >= room.totalRooms) {
            document.getElementById('nextBtn').style.opacity = '0.5';
            document.getElementById('nextBtn').style.pointerEvents = 'none';
        }
    }
    
    function showError(message) {
        document.getElementById('roomDescription').textContent = message;
    }
})();
