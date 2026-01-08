#!/usr/bin/env python3
"""
Lock Quest Monsters - Batch Collage Generator (FIXED)
Creates 6 separate 10x10 grid collages from 600 photos
- Better filename matching
- Crops photos to fill cells (no white padding)
- Even spacing throughout
"""

from PIL import Image, ImageOps
import os
import glob
import time

# Configuration
CANVAS_WIDTH = 6000
CANVAS_HEIGHT = 4800
GRID_COLS = 10
GRID_ROWS = 10
BORDER_WIDTH = 6
OUTER_PADDING = 6  # Padding around entire canvas edges
PHOTOS_PER_COLLAGE = 100
TOTAL_COLLAGES = 6

# CHANGE THIS to point to your photos folder
PHOTOS_FOLDER = "."  # Current directory
# Or use absolute path like: "/Users/yourname/lockquests/photos"

# Output folder for collages
OUTPUT_FOLDER = "./collages"

# Calculate photo dimensions
# Subtract outer padding from both sides (left+right, top+bottom)
available_width = CANVAS_WIDTH - (GRID_COLS - 1) * BORDER_WIDTH - (2 * OUTER_PADDING)
available_height = CANVAS_HEIGHT - (GRID_ROWS - 1) * BORDER_WIDTH - (2 * OUTER_PADDING)
photo_width = available_width // GRID_COLS
photo_height = available_height // GRID_ROWS

print(f"🎨 Lock Quest Monsters - Batch Collage Generator (FIXED)")
print(f"=" * 60)
print(f"Creating {TOTAL_COLLAGES} collages (600 photos total)")
print(f"Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}")
print(f"Grid: {GRID_ROWS}x{GRID_COLS} = {PHOTOS_PER_COLLAGE} photos per collage")
print(f"Each photo: {photo_width}x{photo_height} (crop to fill)")
print(f"Border: {BORDER_WIDTH}pt white between photos")
print(f"Outer padding: {OUTER_PADDING}pt white around edges")
print(f"Photos folder: {PHOTOS_FOLDER}")
print(f"Output folder: {OUTPUT_FOLDER}")
print()

# Check if photos folder exists
if not os.path.exists(PHOTOS_FOLDER):
    print(f"❌ Error: Photos folder not found: {PHOTOS_FOLDER}")
    exit(1)

# Create output folder if it doesn't exist
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Scan for all photos - MORE PRECISE MATCHING
print("📁 Scanning for photos...")
all_photo_files = {}

for i in range(1, 601):  # 1 to 600
    photo_num_str = f"{i:04d}"
    
    # Look for files with exact pattern: ####-*.jpg
    pattern = os.path.join(PHOTOS_FOLDER, f"{photo_num_str}-*.jpg")
    matches = glob.glob(pattern)
    
    if matches:
        # Filter to ensure we get EXACT match (not 0001 matching 0001X)
        exact_matches = [m for m in matches if os.path.basename(m).startswith(f"{photo_num_str}-")]
        if exact_matches:
            # If multiple matches, take the first one
            all_photo_files[i] = exact_matches[0]

print(f"✅ Found {len(all_photo_files)} photos out of 600")

# Show some examples
print("\nFirst 5 photos found:")
for i in range(1, 6):
    if i in all_photo_files:
        print(f"  {i:04d}: {os.path.basename(all_photo_files[i])}")
print()

# Create each collage
total_success = 0
total_failed = 0
all_failed = []

for collage_num in range(1, TOTAL_COLLAGES + 1):
    # Calculate range for this collage
    start_photo = (collage_num - 1) * PHOTOS_PER_COLLAGE + 1
    end_photo = collage_num * PHOTOS_PER_COLLAGE
    
    print(f"{'='*60}")
    print(f"🖼️  COLLAGE {collage_num}/6: Photos {start_photo:04d}-{end_photo:04d}")
    print(f"{'='*60}")
    
    # Create canvas with white background
    canvas = Image.new('RGB', (CANVAS_WIDTH, CANVAS_HEIGHT), 'white')
    
    success_count = 0
    fail_count = 0
    failed_photos = []
    
    # Process photos for this collage
    for i in range(start_photo, end_photo + 1):
        # Calculate position in grid (relative to this collage)
        position_in_collage = i - start_photo
        row = position_in_collage // GRID_COLS
        col = position_in_collage % GRID_COLS
        
        # Calculate pixel position with borders AND outer padding
        x = OUTER_PADDING + col * (photo_width + BORDER_WIDTH)
        y = OUTER_PADDING + row * (photo_height + BORDER_WIDTH)
        
        if i in all_photo_files:
            photo_path = all_photo_files[i]
            try:
                # Open image
                img = Image.open(photo_path)
                
                # FIX ORIENTATION - Apply EXIF rotation data
                img = ImageOps.exif_transpose(img)
                
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # CROP TO FILL - This is the key change!
                # Calculate aspect ratios
                img_aspect = img.width / img.height
                cell_aspect = photo_width / photo_height
                
                if img_aspect > cell_aspect:
                    # Image is wider than cell - crop sides
                    new_height = img.height
                    new_width = int(new_height * cell_aspect)
                    left = (img.width - new_width) // 2
                    img = img.crop((left, 0, left + new_width, new_height))
                else:
                    # Image is taller than cell - crop top/bottom
                    new_width = img.width
                    new_height = int(new_width / cell_aspect)
                    top = (img.height - new_height) // 2
                    img = img.crop((0, top, new_width, top + new_height))
                
                # Now resize to exact dimensions
                img = img.resize((photo_width, photo_height), Image.Resampling.LANCZOS)
                
                # Paste onto main canvas
                canvas.paste(img, (x, y))
                success_count += 1
                
                # Show progress
                filename = os.path.basename(photo_path)
                progress = i - start_photo + 1
                print(f"  ✓ {progress:3d}/100: {filename[:60]}", end='\r')
                
            except Exception as e:
                fail_count += 1
                failed_photos.append((i, os.path.basename(photo_path), str(e)[:50]))
                progress = i - start_photo + 1
                print(f"  ✗ {progress:3d}/100: Error - {os.path.basename(photo_path)[:40]}")
        else:
            # Photo not found - leave white space
            fail_count += 1
            failed_photos.append((i, "N/A", "Not found"))
            progress = i - start_photo + 1
            # Don't spam console for missing photos
    
    print()  # New line after progress
    print(f"  ✅ Placed: {success_count} photos")
    if fail_count > 0:
        print(f"  ⚠️  Missing/Failed: {fail_count} photos")
        if failed_photos:
            print(f"     Missing: {[x[0] for x in failed_photos if x[1] == 'N/A'][:10]}")
    
    # Save this collage
    output_filename = f"lockquests_collage_{start_photo:04d}-{end_photo:04d}.jpg"
    output_path = os.path.join(OUTPUT_FOLDER, output_filename)
    
    print(f"  💾 Saving: {output_filename}...")
    canvas.save(output_path, 'JPEG', quality=95, optimize=True)
    
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"  ✅ Saved! ({file_size_mb:.2f} MB)")
    
    total_success += success_count
    total_failed += fail_count
    all_failed.extend(failed_photos)
    
    print()
    time.sleep(0.5)  # Brief pause between collages

# Final summary
print(f"{'='*60}")
print(f"🎉 ALL COLLAGES COMPLETE!")
print(f"{'='*60}")
print(f"✅ Total photos placed: {total_success}/600")
if total_failed > 0:
    print(f"⚠️  Total missing/failed: {total_failed}")
print(f"\n📁 Output location: {OUTPUT_FOLDER}/")
print(f"   Files created:")
for i in range(1, TOTAL_COLLAGES + 1):
    start = (i - 1) * 100 + 1
    end = i * 100
    filename = f"lockquests_collage_{start:04d}-{end:04d}.jpg"
    filepath = os.path.join(OUTPUT_FOLDER, filename)
    if os.path.exists(filepath):
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        print(f"   ✓ {filename} ({size_mb:.2f} MB)")

if all_failed:
    print(f"\n⚠️  Missing/Failed photos ({len(all_failed)} total):")
    # Show only "Not found" photos
    missing = [x for x in all_failed if x[1] == "N/A"]
    errors = [x for x in all_failed if x[1] != "N/A"]
    
    if missing:
        print(f"   Not found: {[x[0] for x in missing][:20]}")
        if len(missing) > 20:
            print(f"   ... and {len(missing) - 20} more missing")
    
    if errors:
        print(f"   Errors: {len(errors)} photos")
        for num, filename, error in errors[:5]:
            print(f"      #{num:04d} ({filename[:30]}): {error}")

print(f"\n🎊 Done! Your 6 collages are ready in the '{OUTPUT_FOLDER}' folder.")
print(f"\n✨ All photos are now CROPPED TO FILL with even spacing!")
