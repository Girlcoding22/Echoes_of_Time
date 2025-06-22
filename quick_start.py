#!/usr/bin/env python3
"""
Quick Start Script for Video to Text Converter
"""

import os
import sys
import subprocess
import webbrowser
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version.split()[0]}")
    return True

def install_dependencies():
    """Install required dependencies"""
    print("\n📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def setup_environment():
    """Set up environment file"""
    print("\n🔧 Setting up environment...")
    
    env_file = Path(".env")
    env_example = Path("env_example.txt")
    
    if not env_example.exists():
        print("❌ env_example.txt not found")
        return False
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    try:
        # Copy example to .env
        with open(env_example, 'r') as f:
            content = f.read()
        
        with open(env_file, 'w') as f:
            f.write(content)
        
        print("✅ Created .env file")
        print("⚠️  Please edit .env and add your Anthropic API key")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def get_api_key():
    """Get API key from user"""
    print("\n🔑 Setting up API key...")
    
    api_key = input("Enter your Anthropic API key (or press Enter to skip): ").strip()
    
    if not api_key:
        print("⚠️  API key not provided. You'll need to add it to .env file later.")
        return True
    
    # Update .env file
    try:
        env_file = Path(".env")
        if env_file.exists():
            with open(env_file, 'r') as f:
                content = f.read()
            
            content = content.replace("your_anthropic_api_key_here", api_key)
            
            with open(env_file, 'w') as f:
                f.write(content)
            
            print("✅ API key saved to .env file")
            return True
        else:
            print("❌ .env file not found")
            return False
            
    except Exception as e:
        print(f"❌ Failed to save API key: {e}")
        return False

def run_tests():
    """Run system tests"""
    print("\n🧪 Running system tests...")
    try:
        result = subprocess.run([sys.executable, "test_system.py"], capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Failed to run tests: {e}")
        return False

def start_web_server():
    """Start the web server"""
    print("\n🌐 Starting web server...")
    print("The application will open in your browser automatically.")
    print("Press Ctrl+C to stop the server.")
    
    try:
        # Open browser after a short delay
        import threading
        import time
        
        def open_browser():
            time.sleep(2)
            webbrowser.open("http://localhost:5000")
        
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        # Start Flask app
        subprocess.run([sys.executable, "app.py"])
        
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")

def main():
    print("🚀 Video to Text Converter - Quick Start")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Install dependencies
    if not install_dependencies():
        return False
    
    # Setup environment
    if not setup_environment():
        return False
    
    # Get API key
    get_api_key()
    
    # Run tests
    if not run_tests():
        print("\n⚠️  Some tests failed, but you can still try running the application")
    
    # Ask user what to do next
    print("\n" + "=" * 50)
    print("🎉 Setup complete!")
    print("\nWhat would you like to do next?")
    print("1. Start web server (opens in browser)")
    print("2. Use command line interface")
    print("3. Exit")
    
    while True:
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == "1":
            start_web_server()
            break
        elif choice == "2":
            print("\nTo use the command line interface:")
            print("python cli.py <video_file>")
            print("Example: python cli.py my_video.mp4")
            break
        elif choice == "3":
            print("👋 Goodbye!")
            break
        else:
            print("Please enter 1, 2, or 3")
    
    return True

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Setup interrupted by user")
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        sys.exit(1) 