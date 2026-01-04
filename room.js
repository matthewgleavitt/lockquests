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
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}/values/${config.SHEET_RANGE}?key=${config.API_KEY}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.values) {
                const room = findRoom(data.values, roomId);
                if (room) {
                    updatePage(room);
                } else {
                    showError('Room not found');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Error loading room data');
        });
    
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
            avgRating: headers.indexOf('Average Rating'),
            mikeRating: headers.indexOf('Mike Rating'),
            mattRating: headers.indexOf('Matt Rating'),
            togetherNum: headers.indexOf('Together Unique #'),
            description: headers.indexOf('Description')
        };
        
        for (let row of rows) {
            const together = parseInt(row[colIndices.togetherNum]);
            if (together === targetId) {
                return {
                    togetherNum: together,
                    roomName: row[colIndices.roomName] || '',
                    company: row[colIndices.company] || '',
                    location: row[colIndices.location] || '',
                    state: row[colIndices.state] || '',
                    date: row[colIndices.date] || '',
                    timeLeft: row[colIndices.timeLeft] || '',
                    avgRating: parseFloat(row[colIndices.avgRating]) || 0,
                    mikeRating: parseFloat(row[colIndices.mikeRating]) || 0,
                    mattRating: parseFloat(row[colIndices.mattRating]) || 0,
                    description: row[colIndices.description] || 'Add a description column to your Google Sheet to display it here.'
                };
            }
        }
        return null;
    }
    
    function updatePage(data) {
        const numPadded = String(data.togetherNum).padStart(4, '0');
        const slug = slugify(data.roomName);
        const photoFilename = `${numPadded}-${slug}`;
        
        document.getElementById('pageTitle').textContent = 
            `${data.roomName} [${data.company}] - Lock Quests`;
        document.getElementById('roomTitle').textContent = 
            `${data.roomName} [${data.company}]`;
        document.getElementById('gameName').textContent = data.roomName;
        document.getElementById('companyLink').textContent = data.company;
        document.getElementById('roomLocation').textContent = 
            `${data.location}, ${data.state}`;
        document.getElementById('locationDetail').textContent = 
            `${data.location}, ${data.state}`;
        document.getElementById('roomCategory').textContent = data.state;
        document.getElementById('roomCategory').href = `index.html?state=${encodeURIComponent(data.state)}`;
        document.getElementById('breadcrumbState').textContent = data.state;
        document.getElementById('breadcrumbState').href = `index.html?state=${encodeURIComponent(data.state)}`;
        document.getElementById('breadcrumbRoom').textContent = data.roomName;
        document.getElementById('timeLeft').textContent = data.timeLeft || 'N/A';
        document.getElementById('avgRating').textContent = 
            `${data.avgRating.toFixed(1)} / 5.0`;
        document.getElementById('mikeRating').textContent = data.mikeRating.toFixed(1);
        document.getElementById('mattRating').textContent = data.mattRating.toFixed(1);
        document.getElementById('imageNumber').textContent = 
            `#${numPadded}`;
        document.getElementById('navNumber').textContent = data.togetherNum;
        document.getElementById('roomDescription').textContent = data.description;
        
        // Photo - try .jpg first, then .JPG
        const imgJpg = new Image();
        imgJpg.onload = function() {
            document.getElementById('featuredImage').innerHTML = 
                `<img src="https://matthewgleavitt.github.io/lockquests/photos/${photoFilename}.jpg" alt="${data.roomName}" style="width: 100%; height: 100%; object-fit: cover;">`;
        };
        imgJpg.onerror = function() {
            // Try .JPG
            const imgJPG = new Image();
            imgJPG.onload = function() {
                document.getElementById('featuredImage').innerHTML = 
                    `<img src="https://matthewgleavitt.github.io/lockquests/photos/${photoFilename}.JPG" alt="${data.roomName}" style="width: 100%; height: 100%; object-fit: cover;">`;
            };
            imgJPG.onerror = function() {
                document.getElementById('imageStatus').textContent = 
                    `📷 Upload: ${photoFilename}.jpg or .JPG`;
            };
            imgJPG.src = `https://matthewgleavitt.github.io/lockquests/photos/${photoFilename}.JPG`;
        };
        imgJpg.src = `https://matthewgleavitt.github.io/lockquests/photos/${photoFilename}.jpg`;
        
        // Format dates
        const date = new Date(data.date);
        document.getElementById('roomDate').textContent = 
            date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('datePlayed').textContent = 
            date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        
        // Animate rating bars
        setTimeout(() => {
            document.getElementById('mikeBar').style.width = 
                `${(data.mikeRating / 5) * 100}%`;
            document.getElementById('mattBar').style.width = 
                `${(data.mattRating / 5) * 100}%`;
        }, 100);
        
        // Tags - NOW CLICKABLE!
        const ratingFloor = Math.floor(data.avgRating * 2) / 2; // Round to nearest 0.5
        const tagHtml = [
            `<a href="index.html?rating=${ratingFloor}" class="tag">Rating: ${data.avgRating.toFixed(1)}</a>`,
            `<a href="index.html?state=${encodeURIComponent(data.state)}" class="tag">${data.state}</a>`,
            `<a href="index.html?company=${encodeURIComponent(data.company)}" class="tag">${data.company}</a>`
        ].join('');
        document.getElementById('tagList').innerHTML = tagHtml;
        
        // Navigation
        document.getElementById('prevBtn').href = `room.html?id=${data.togetherNum - 1}`;
        document.getElementById('nextBtn').href = `room.html?id=${data.togetherNum + 1}`;
    }
    
    function showError(message) {
        document.getElementById('roomDescription').textContent = message;
    }
})();
