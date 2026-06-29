import os
import base64
from io import BytesIO
from PIL import Image

def main():
    # Resolve paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    source_path = os.path.join(script_dir, "logo-source.png")
    icons_dir = os.path.join(script_dir, "icons")
    web_public_dir = os.path.join(script_dir, "..", "apps", "web", "public")

    if not os.path.exists(source_path):
        print(f"Error: Source logo not found at {source_path}")
        return

    os.makedirs(icons_dir, exist_ok=True)

    print("Opening source logo...")
    img = Image.open(source_path)

    # Pad to square to preserve aspect ratio
    w, h = img.size
    max_side = max(w, h)
    print(f"Original image size: {w}x{h}. Squaring to {max_side}x{max_side}...")
    
    square_img = Image.new("RGBA", (max_side, max_side), (0, 0, 0, 0))
    offset_x = (max_side - w) // 2
    offset_y = (max_side - h) // 2
    square_img.paste(img, (offset_x, offset_y))

    # Resolve resampler (LANCZOS)
    try:
        resample_filter = Image.Resampling.LANCZOS
    except AttributeError:
        resample_filter = Image.ANTIALIAS

    # Generate extension icons
    sizes = [16, 48, 128]
    for size in sizes:
        resized = square_img.resize((size, size), resample=resample_filter)
        dest_path = os.path.join(icons_dir, f"icon{size}.png")
        resized.save(dest_path, "PNG")
        print(f"Generated: icon{size}.png")

    # Generate web public assets
    if os.path.exists(web_public_dir):
        # 128x128 extension-icon.png
        ext_icon_path = os.path.join(web_public_dir, "extension-icon.png")
        resized_128 = square_img.resize((128, 128), resample=resample_filter)
        resized_128.save(ext_icon_path, "PNG")
        print("Generated: apps/web/public/extension-icon.png")

        # 512x512 logo.png
        logo_path = os.path.join(web_public_dir, "logo.png")
        resized_512 = square_img.resize((512, 512), resample=resample_filter)
        resized_512.save(logo_path, "PNG")
        print("Generated: apps/web/public/logo.png")

        # 180x180 base64 favicon.svg
        resized_180 = square_img.resize((180, 180), resample=resample_filter)
        buffered = BytesIO()
        resized_180.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        svg_content = f"""<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/png;base64,{img_str}" x="0" y="0" width="180" height="180" />
</svg>
"""
        favicon_path = os.path.join(web_public_dir, "favicon.svg")
        with open(favicon_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print("Generated: apps/web/public/favicon.svg (base64 embedded)")
    else:
        print(f"Warning: Web public directory not found at {web_public_dir}, skipping web logos/favicon.")

    print("All icons generated successfully.")

if __name__ == "__main__":
    main()
