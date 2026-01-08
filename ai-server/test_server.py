"""
Test script for AI verification server
Run this to test if the server and model are working correctly
"""

import requests
import os
import sys

# Configuration
SERVER_URL = "http://localhost:5000"
TEST_IMAGE_PATH = None  # Will try to find test images automatically

def find_test_image():
    """Find a test image from the dataset"""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, 'AI-models', 'dataset-labeled')
    
    # Try to find a real product image
    real_path = os.path.join(dataset_path, 'real')
    if os.path.exists(real_path):
        for root, dirs, files in os.walk(real_path):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    return os.path.join(root, file)
    
    return None

def test_health():
    """Test server health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{SERVER_URL}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✓ Server is healthy")
            print(f"  Model loaded: {data.get('model_loaded')}")
            print(f"  Model type: {data.get('model_type')}")
            print(f"  Image size: {data.get('image_size')}")
            print(f"  Classes: {data.get('classes')}")
            return True
        else:
            print(f"✗ Server returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server. Is it running?")
        print("  Start the server with: python app.py")
        return False
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def test_model_info():
    """Test model info endpoint"""
    print("\nTesting model info endpoint...")
    try:
        response = requests.get(f"{SERVER_URL}/api/model-info", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✓ Model info retrieved")
            print(f"  Model type: {data.get('model_type')}")
            print(f"  Image size: {data.get('image_size')}")
            print(f"  Classes: {data.get('classes')}")
            print(f"  Training info:")
            training = data.get('training_info', {})
            print(f"    - Base model: {training.get('base_model')}")
            print(f"    - Total epochs: {training.get('total_epochs')}")
            print(f"    - Training accuracy: {training.get('training_accuracy')}")
            print(f"    - Validation accuracy: {training.get('validation_accuracy')}")
            return True
        else:
            print(f"✗ Server returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def test_image_verification(image_path):
    """Test image verification endpoint"""
    print("\nTesting image verification...")
    
    if not image_path or not os.path.exists(image_path):
        print("⚠ No test image found. Skipping image verification test.")
        print("  To test, place an image in AI-models/dataset-labeled/real/ or /fake/")
        return None
    
    try:
        print(f"  Using test image: {os.path.basename(image_path)}")
        
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(
                f"{SERVER_URL}/api/verify-image", 
                files=files, 
                timeout=30
            )
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Image verification successful")
            print(f"  Prediction: {data.get('prediction').upper()}")
            print(f"  Is Genuine: {'YES' if data.get('is_genuine') else 'NO'}")
            print(f"  Confidence: {data.get('confidence')}%")
            print(f"  Probabilities:")
            probs = data.get('probabilities', {})
            print(f"    - Real: {probs.get('real')}%")
            print(f"    - Fake: {probs.get('fake')}%")
            print(f"  Message: {data.get('message')}")
            return True
        else:
            print(f"✗ Server returned status code: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def main():
    print("="*70)
    print("AI Product Verification Server - Test Suite")
    print("="*70)
    print(f"\nServer URL: {SERVER_URL}")
    
    # Try to find a test image
    global TEST_IMAGE_PATH
    if not TEST_IMAGE_PATH:
        TEST_IMAGE_PATH = find_test_image()
    
    print(f"Test Image: {TEST_IMAGE_PATH if TEST_IMAGE_PATH else 'Not found'}")
    print("\n" + "-"*70 + "\n")
    
    # Run tests
    results = {
        'health': test_health(),
        'model_info': test_model_info(),
        'image_verification': test_image_verification(TEST_IMAGE_PATH)
    }
    
    # Summary
    print("\n" + "="*50)
    print("Test Summary")
    print("="*50)
    
    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    skipped = sum(1 for v in results.values() if v is None)
    
    print(f"✓ Passed: {passed}")
    print(f"✗ Failed: {failed}")
    print(f"⚠ Skipped: {skipped}")
    
    if failed == 0 and passed >= 2:
        print("\n✓ All critical tests passed! Server is ready.")
        return 0
    elif failed > 0:
        print("\n✗ Some tests failed. Please check the server.")
        return 1
    else:
        print("\n⚠ Server is running but not fully tested.")
        return 0

if __name__ == "__main__":
    sys.exit(main())
