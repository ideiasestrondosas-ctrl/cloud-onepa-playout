import os
import shutil
import subprocess
import json
import zipfile
import re
from datetime import datetime

# Configuration
PROJECT_ROOT = os.getcwd()
BACKEND_CARGO = os.path.join(PROJECT_ROOT, "backend", "Cargo.toml")
FRONTEND_PACKAGE = os.path.join(PROJECT_ROOT, "frontend", "package.json")
EXCLUDE_ZIP = [
    "node_modules", 
    "target", 
    ".git", 
    ".idea", 
    ".vscode", 
    "release.zip",
    "big_buck_bunny_1080p_h264.mov",
    "__pycache__",
    ".DS_Store"
]
EXCLUDE_GIT = ["big_buck_bunny_1080p_h264.mov"]

def run_command(command, shell=True):
    try:
        result = subprocess.run(command, shell=shell, check=True, text=True, capture_output=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}\n{e.stderr}")
        return None

def update_cargo_version(new_version):
    with open(BACKEND_CARGO, 'r') as f:
        content = f.read()
    
    # Simple regex replacement for version in [package] section
    # This assumes version is near the top
    new_content = re.sub(r'version = "[^"]+"', f'version = "{new_version}"', content, count=1)
    
    with open(BACKEND_CARGO, 'w') as f:
        f.write(new_content)
    print(f"Updated backend/Cargo.toml to {new_version}")

def update_npm_version(new_version):
    with open(FRONTEND_PACKAGE, 'r') as f:
        data = json.load(f)
    
    data['version'] = new_version
    
    with open(FRONTEND_PACKAGE, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Updated frontend/package.json to {new_version}")

def clean_artifacts():
    print("Cleaning artifacts...")
    # Clean backend target
    # run_command("cargo clean --manifest-path backend/Cargo.toml") 
    # Clean python cache
    for root, dirs, files in os.walk(PROJECT_ROOT):
        for d in dirs:
            if d == "__pycache__":
                shutil.rmtree(os.path.join(root, d))
    
    zip_path = os.path.join(PROJECT_ROOT, "release.zip")
    if os.path.exists(zip_path):
        os.remove(zip_path)
    print("Cleanup complete.")

def git_operations(version):
    print("Preparing Git commit...")
    run_command("git add .")
    # Reset excluded files
    for excl in EXCLUDE_GIT:
        run_command(f"git reset {excl}")
    
    msg = f"chore(release): bump version to {version}"
    print(f"Committing with message: {msg}")
    run_command(f'git commit -m "{msg}"')
    
    print("Pushing to origin...")
    run_command("git push origin main") 
    # Adjust branch name if necessary

def create_zip(version):
    zip_filename = f"onepa-playout-v{version}.zip"
    print(f"Creating release archive: {zip_filename}...")
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_ZIP]
            
            for file in files:
                if file in EXCLUDE_ZIP or file == zip_filename:
                    continue
                
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, PROJECT_ROOT)
                zipf.write(file_path, arcname)
    
    print(f"Archive created: {zip_filename}")
    return zip_filename

def main():
    print("=== ONEPA Playout Release Manager ===")
    
    # 1. Ask for version
    current_version = "unknown"
    try:
        with open(FRONTEND_PACKAGE, 'r') as f:
            current_version = json.load(f).get('version', '0.0.0')
    except:
        pass
        
    print(f"Current Frontend Version: {current_version}")
    new_version = input("Enter new version (e.g., 1.8.0): ").strip()
    if not new_version:
        print("Version required.")
        return

    # 2. Update Clean
    if input("Clean artifacts first? (y/n): ").lower() == 'y':
        clean_artifacts()

    # 3. Update Docs & Version
    print(f"Updating version to {new_version}...")
    update_cargo_version(new_version)
    update_npm_version(new_version)
    
    # 4. Git Operations
    if input("Commit and Push changes? (y/n): ").lower() == 'y':
        git_operations(new_version)
    
    # 5. Create Zip
    if input("Create Release Zip? (y/n): ").lower() == 'y':
        zip_name = create_zip(new_version)
        print(f"Release ready: {zip_name}")

if __name__ == "__main__":
    main()
