═══════════════════════════════════════════════════════════════
LOCK QUESTS - AUTO-GENERATED ESCAPE ROOM REVIEW SITE
═══════════════════════════════════════════════════════════════

📦 WHAT'S INCLUDED:
-------------------
- index.html        (Main listing page)
- room.html         (Individual room page template)
- style.css         (All styling)
- app.js            (Main page logic)
- room.js           (Room page logic)
- config.js         (⚠️ EDIT THIS FILE - add your Google Sheets info)
- README.txt        (This file)

🚀 QUICK SETUP (5 Minutes):
----------------------------

STEP 1: Upload to Google Sheets
--------------------------------
1. Go to sheets.google.com
2. File → Import → Upload your Lock_Quest_Tracker_FINAL.xlsx
3. Make sure the "Master List" sheet exists

STEP 2: Share Your Sheet
-------------------------
1. Click the green "Share" button
2. Change "Restricted" to "Anyone with the link"
3. Make sure it's set to "Viewer"
4. Copy the link

STEP 3: Get Sheet ID
---------------------
From your link:
https://docs.google.com/spreadsheets/d/ABC123XYZ456/edit

Your Sheet ID is: ABC123XYZ456

STEP 4: Create Google API Key
------------------------------
1. Go to console.cloud.google.com
2. Click "APIs & Services" → "Credentials"
3. Click "+ CREATE CREDENTIALS"
4. Select "API key"
5. Copy the key (looks like: AIzaSyAbc123...)
6. Click "Restrict Key"
7. Under "API restrictions" → select "Restrict key"
8. Check only "Google Sheets API"
9. Click "Save"

STEP 5: Edit config.js
-----------------------
1. Open config.js in a text editor (Notepad, TextEdit, VS Code, etc.)
2. Replace 'YOUR_SHEET_ID' with your Sheet ID
3. Replace 'YOUR_API_KEY' with your API Key
4. Save the file

Example:
--------
SHEET_ID: 'ABC123XYZ456',
API_KEY: 'AIzaSyAbc123...',

STEP 6: Upload Files
--------------------
Upload ALL files to your web hosting:
- Via FTP (FileZilla, etc.)
- Via WordPress File Manager plugin
- Via cPanel File Manager
- Or drag to Netlify/GitHub Pages

📸 ADDING PHOTOS:
-----------------
Option 1 (Recommended): Add a "Photo URL" column to your Google Sheet
- Column header: "Photo URL"
- Fill with image URLs (https://...)
- Photos will auto-display

Option 2: I can scrape your existing lockquests.com photos
- Let me know and I'll create the scraper script!

📝 ADDING DESCRIPTIONS:
-----------------------
Add a "Description" column to your Google Sheet
- Column header: "Description"
- Fill with room descriptions
- They'll auto-display on room pages

🔄 UPDATING YOUR SITE:
----------------------
Just edit your Google Sheet - changes appear in real-time!
No need to re-upload anything.

🆘 TROUBLESHOOTING:
-------------------
Nothing showing up?
→ Check browser console (F12) for errors
→ Verify Sheet ID and API Key in config.js
→ Make sure sheet is shared publicly

Can't access Google Sheets API?
→ Make sure you enabled "Google Sheets API" in Google Cloud Console
→ Make sure API key is unrestricted or restricted to Sheets API only

Still stuck?
→ Email me with a screenshot and I'll help!

💡 TIPS:
--------
- Keep your Google Sheet organized
- Use the "Together Unique #" column for navigation
- Add tags in a "Tags" column (comma-separated)
- Photos work best at 1200x675px

═══════════════════════════════════════════════════════════════
Questions? Need help? Let me know!
═══════════════════════════════════════════════════════════════
