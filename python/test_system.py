#!/usr/bin/env python3
"""
Test script for Video to Text Converter
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    
    try:
        import cv2
        print("✅ OpenCV imported successfully")
    except ImportError as e:
        print(f"❌ OpenCV import failed: {e}")
        return False
    
    try:
        import torch
        print(f"✅ PyTorch imported successfully (version: {torch.__version__})")
    except ImportError as e:
        print(f"❌ PyTorch import failed: {e}")
        return False
    
    try:
        from transformers import Blip2Processor, Blip2ForConditionalGeneration
        print("✅ Transformers imported successfully")
    except ImportError as e:
        print(f"❌ Transformers import failed: {e}")
        return False
    
    try:
        import anthropic
        print("✅ Anthropic imported successfully")
    except ImportError as e:
        print(f"❌ Anthropic import failed: {e}")
        return False
    
    try:
        from flask import Flask
        print("✅ Flask imported successfully")
    except ImportError as e:
        print(f"❌ Flask import failed: {e}")
        return False
    
    return True

def test_api_key():
    """Test if API key is set"""
    print("\nTesting API key...")
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not found in environment")
        print("Please set it in your .env file")
        return False
    
    if api_key == "your_anthropic_api_key_here":
        print("❌ API key not configured (still using placeholder)")
        return False
    
    print("✅ API key found")
    return True

def test_cuda():
    """Test CUDA availability"""
    print("\nTesting CUDA...")
    
    try:
        import torch
        if torch.cuda.is_available():
            print(f"✅ CUDA available: {torch.cuda.get_device_name(0)}")
            print(f"   CUDA version: {torch.version.cuda}")
        else:
            print("⚠️  CUDA not available, will use CPU")
    except Exception as e:
        print(f"⚠️  CUDA test failed: {e}")
    
    return True

def test_model_loading():
    """Test if BLIP-2 model can be loaded"""
    print("\nTesting model loading...")
    
    try:
        from video_processor import VideoProcessor
        processor = VideoProcessor()
        
        if processor.model is None:
            print("❌ BLIP-2 model failed to load")
            return False
        
        print("✅ BLIP-2 model loaded successfully")
        return True
        
    except Exception as e:
        print(f"❌ Model loading failed: {e}")
        return False

def test_claude_integration():
    """Test Claude API integration"""
    print("\nTesting Claude integration...")
    
    try:
        from claude_integration import ClaudeVideoDescriber
        describer = ClaudeVideoDescriber()
        print("✅ Claude integration initialized")
        return True
        
    except Exception as e:
        print(f"❌ Claude integration failed: {e}")
        return False

def main():
    print("🧪 Video to Text Converter - System Test")
    print("=" * 50)
    
    tests = [
        ("Imports", test_imports),
        ("API Key", test_api_key),
        ("CUDA", test_cuda),
        ("Model Loading", test_model_loading),
        ("Claude Integration", test_claude_integration),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! System is ready to use.")
        print("\nNext steps:")
        print("1. Run 'python app.py' for web interface")
        print("2. Run 'python cli.py video.mp4' for command line")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        print("\nCommon solutions:")
        print("1. Install missing dependencies: pip install -r requirements.txt")
        print("2. Set your ANTHROPIC_API_KEY in .env file")
        print("3. Ensure you have sufficient RAM for model loading")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 