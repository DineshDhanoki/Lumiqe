import os

directories = [
    r"c:\Users\KANISHK\OneDrive\Desktop\Opsia",
]

ignore_dirs = {'.git', 'node_modules', '.venv', '__pycache__', '.next', 'dist', 'build', 'versions'}
ignore_exts = {'.png', '.jpg', '.jpeg', '.webp', '.ico', '.svg', '.pyc', '.pdf'}

replacements = [
    ("Opsia", "Lumiqe"),
    ("opsia", "lumiqe"),
    ("OPSIA", "LUMIQE")
]

for d in directories:
    for root, dirs, files in os.walk(d):
        dirs[:] = [dir for dir in dirs if dir not in ignore_dirs]
        for file in files:
            if any(file.endswith(ext) for ext in ignore_exts):
                continue
            
            filepath = os.path.join(root, file)
            # Skip python script itself
            if "replace_brand.py" in filepath:
                continue

            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for old, new in replacements:
                    new_content = new_content.replace(old, new)
                
                # Tagline update
                new_content = new_content.replace("AI-Powered Skin Tone Analysis", "Discover Your True Colors with AI")
                
                if content != new_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {filepath}")
            except Exception:
                pass
