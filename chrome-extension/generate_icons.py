from PIL import Image, ImageDraw, ImageFont

def create_icon(size):
    # Create colored background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # Draw text
    text = "LHS"
    try:
        font = ImageFont.truetype("arial.ttf", size // 3)
    except:
        font = ImageFont.load_default()
    
    # Center text
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((size - text_width) // 2, (size - text_height) // 2)
    
    draw.text(position, text, fill='white', font=font)
    
    # Save in CURRENT directory (NOT in subfolder)
    img.save(f'icon{size}.png')
    print(f"Created icon{size}.png")

# Generate all sizes
create_icon(16)
create_icon(48)
create_icon(128)
print("\n✅ All icons generated in current directory!")
