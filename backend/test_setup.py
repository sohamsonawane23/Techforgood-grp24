#!/usr/bin/env python3
"""
Test script for image classification module
Run this to verify the setup before starting the full app
"""

import os
import sys

def test_imports():
    """Test all required imports"""
    print("🔍 Testing imports...")
    
    try:
        import tensorflow
        print("✅ TensorFlow imported successfully")
    except ImportError as e:
        print(f"❌ TensorFlow import failed: {e}")
        return False
    
    try:
        from tensorflow.keras.applications import MobileNetV2
        print("✅ MobileNetV2 available")
    except ImportError as e:
        print(f"❌ MobileNetV2 import failed: {e}")
        return False
    
    try:
        from PIL import Image
        print("✅ Pillow (PIL) available")
    except ImportError as e:
        print(f"❌ Pillow import failed: {e}")
        return False
    
    try:
        import numpy
        print("✅ NumPy available")
    except ImportError as e:
        print(f"❌ NumPy import failed: {e}")
        return False
    
    try:
        from fastapi import FastAPI
        print("✅ FastAPI available")
    except ImportError as e:
        print(f"❌ FastAPI import failed: {e}")
        return False
    
    try:
        from sqlalchemy import create_engine
        print("✅ SQLAlchemy available")
    except ImportError as e:
        print(f"❌ SQLAlchemy import failed: {e}")
        return False
    
    return True

def test_model_loading():
    """Test if MobileNetV2 model can be loaded"""
    print("\n🔍 Testing model loading (this may take a minute on first run)...")
    
    try:
        from tensorflow.keras.applications import MobileNetV2
        print("⏳ Loading MobileNetV2 model...")
        model = MobileNetV2(weights='imagenet')
        print("✅ MobileNetV2 model loaded successfully!")
        print(f"   Model summary:")
        print(f"   - Input shape: (224, 224, 3)")
        print(f"   - Output classes: 1000 (ImageNet)")
        return True
    except Exception as e:
        print(f"❌ Model loading failed: {e}")
        return False

def test_image_classifier():
    """Test the image classifier module"""
    print("\n🔍 Testing image_classifier module...")
    
    try:
        from image_classifier import classify_image, get_priority_from_category
        print("✅ image_classifier imported successfully")
        
        # Test priority assignment
        test_category = "Pothole"
        priority = get_priority_from_category(test_category)
        expected = "High"
        if priority == expected:
            print(f"✅ Priority assignment works: {test_category} → {priority}")
        else:
            print(f"❌ Priority assignment failed: {test_category} → {priority} (expected {expected})")
            return False
        
        return True
    except ImportError as e:
        print(f"❌ image_classifier import failed: {e}")
        return False

def test_database():
    """Test database connection"""
    print("\n🔍 Testing database...")
    
    try:
        from database import SessionLocal, engine
        db = SessionLocal()
        db.close()
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def main():
    print("=" * 60)
    print("🧪 Techforgood Image Classification Test Suite")
    print("=" * 60)
    
    tests = [
        ("Dependencies", test_imports),
        ("Model Loading", test_model_loading),
        ("Image Classifier", test_image_classifier),
        ("Database", test_database),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:.<40} {status}")
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n🎉 All tests passed! Your setup is ready!")
        print("\nNext steps:")
        print("1. Run: uvicorn main:app --reload")
        print("2. Visit: http://localhost:8000/docs")
        print("3. Test the /api/complaints/ endpoint with an image")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        print("Common issues:")
        print("- Missing dependencies: Run 'pip install -r requirements.txt'")
        print("- TensorFlow issues: May need specific OS/Python version")
        print("- Database issues: Check if sqlite works on your system")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
