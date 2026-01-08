from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.applications.efficientnet import preprocess_input
import numpy as np
from PIL import Image
import io
import os
import json
import base64
import time
from functools import wraps
from collections import defaultdict

app = Flask(__name__)
CORS(app)

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'}
RATE_LIMIT_REQUESTS = 30
RATE_LIMIT_WINDOW = 60

request_counts = defaultdict(list)

def rate_limit(max_requests=RATE_LIMIT_REQUESTS, window=RATE_LIMIT_WINDOW):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            client_ip = request.remote_addr or 'unknown'
            current_time = time.time()
            
            request_counts[client_ip] = [
                t for t in request_counts[client_ip] 
                if current_time - t < window
            ]
            
            if len(request_counts[client_ip]) >= max_requests:
                return jsonify({
                    'error': 'Rate limit exceeded. Please try again later.',
                    'retry_after': window
                }), 429
            
            request_counts[client_ip].append(current_time)
            return f(*args, **kwargs)
        return wrapped
    return decorator

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    return size <= MAX_FILE_SIZE

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AI_MODELS_DIR = os.path.join(BASE_DIR, '..', 'AI-models', 'trained_model_improved')
WEIGHTS_PATH = os.path.join(AI_MODELS_DIR, 'model_phase2_high_accuracy_weights.h5')
CONFIG_PATH = os.path.join(AI_MODELS_DIR, 'model_phase2_high_accuracy_config.json')
IMAGE_SIZE = 300

FAKE_THRESHOLD = 0.30
CLASS_NAMES = ['fake', 'real']

model = None
config = None

def build_high_accuracy_model():
    from tensorflow.keras import layers, models
    from tensorflow.keras.applications import EfficientNetB3
    
    print("\n🏗️ Building HIGH-ACCURACY model architecture (Phase 2 - Fine-tuned)...")
    
    base_model = EfficientNetB3(
        weights='imagenet',
        include_top=False,
        input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3)
    )
    
    base_model.trainable = True
    for layer in base_model.layers[:-50]:
        layer.trainable = False
    
    inputs = keras.Input(shape=(IMAGE_SIZE, IMAGE_SIZE, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D(name='global_avg_pool')(x)
    x = layers.BatchNormalization(name='batch_norm_1')(x)
    
    x = layers.Dropout(0.5, name='dropout_1')(x)
    x = layers.Dense(1024, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001), name='dense_1')(x)
    x = layers.BatchNormalization(name='batch_norm_2')(x)
    x = layers.Dropout(0.4, name='dropout_2')(x)
    x = layers.Dense(512, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001), name='dense_2')(x)
    x = layers.BatchNormalization(name='batch_norm_3')(x)
    x = layers.Dropout(0.3, name='dropout_3')(x)
    x = layers.Dense(256, activation='relu', name='dense_3')(x)
    x = layers.Dropout(0.2, name='dropout_4')(x)
    
    outputs = layers.Dense(2, activation='softmax', name='output')(x)
    
    model = models.Model(inputs, outputs, name='HighAccuracyFakeDetection_B3')
    
    print(f"✅ Model architecture built (Phase 2 - Fine-tuned)")
    print(f"   Total layers: {len(model.layers)}")
    print(f"   Trainable layers in base: {sum(1 for l in base_model.layers if l.trainable)}")
    print(f"   Input shape: {model.input_shape}")
    print(f"   Output shape: {model.output_shape}")
    
    return model, base_model

def load_model():
    global model, config
    try:
        print(f"\n🔄 Loading model configuration from: {CONFIG_PATH}")
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r') as f:
                config = json.load(f)
            print("✅ Configuration loaded:")
            print(f"   Focal Alpha: {config.get('focal_alpha', 0.75)}")
            print(f"   Focal Gamma: {config.get('focal_gamma', 2.0)}")
            print(f"   Decision Threshold: {config.get('decision_threshold', 0.30)}")
            print(f"   Phase: {config.get('phase', 'phase2_high_accuracy')}")
        else:
            print("⚠️ Config file not found, using defaults")
            config = {
                'focal_alpha': 0.75,
                'focal_gamma': 2.0,
                'decision_threshold': 0.30,
                'batch_size': 24,
                'image_size': [300, 300],
                'class_names': ['fake', 'real'],
                'phase': 'phase2_high_accuracy'
            }
        
        print(f"\n🏗️ Building model architecture...")
        model, base_model = build_high_accuracy_model()
        
        print(f"🔄 Loading weights from: {WEIGHTS_PATH}")
        if os.path.exists(WEIGHTS_PATH):
            model.load_weights(WEIGHTS_PATH)
            print(f"✅ Weights loaded successfully! ({os.path.getsize(WEIGHTS_PATH) / (1024*1024):.1f} MB)")
        else:
            raise FileNotFoundError(f"Weights file not found: {WEIGHTS_PATH}")
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        print("✅ Model ready for inference!")
        print(f"   Input shape: {model.input_shape}")
        print(f"   Output shape: {model.output_shape}")
        print(f"   Fake threshold: {FAKE_THRESHOLD}")
        print(f"   Classes: {CLASS_NAMES}")
        
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

print("="*60)
print("🚀 Starting AI Fake Product Detection Server")
print("="*60)
load_model()
print("="*60)

def preprocess_image(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img = img.resize((IMAGE_SIZE, IMAGE_SIZE), Image.LANCZOS)
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        return img_array
    except Exception as e:
        raise ValueError(f"Error preprocessing image: {str(e)}")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'model_type': 'EfficientNetB3',
        'image_size': IMAGE_SIZE,
        'classes': CLASS_NAMES,
        'rate_limit': {
            'max_requests': RATE_LIMIT_REQUESTS,
            'window_seconds': RATE_LIMIT_WINDOW
        },
        'file_limits': {
            'max_size_mb': MAX_FILE_SIZE // (1024 * 1024),
            'allowed_types': list(ALLOWED_EXTENSIONS)
        }
    })

@app.route('/api/verify-image', methods=['POST'])
@rate_limit(max_requests=30, window=60)
def verify_image():
    if model is None:
        return jsonify({'error': 'Model not loaded. Please check server logs.'}), 500
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400
    
    if not validate_file_size(file):
        return jsonify({
            'error': f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB'
        }), 400
    
    try:
        image_bytes = file.read()
        processed_image = preprocess_image(image_bytes)
        print(f"\n[INFO] Processing image: {file.filename}")
        print(f"[INFO] Preprocessed shape: {processed_image.shape}")
        
        prediction = model.predict(processed_image, verbose=0)
        fake_probability = float(prediction[0][0])
        real_probability = float(prediction[0][1])
        
        is_fake = fake_probability > FAKE_THRESHOLD
        is_genuine = not is_fake
        predicted_class = 'fake' if is_fake else 'real'
        confidence = fake_probability * 100 if is_fake else real_probability * 100
        
        print(f"[INFO] Prediction: {predicted_class.upper()}")
        print(f"[INFO] Confidence: {confidence:.2f}%")
        print(f"[INFO] Real probability: {real_probability*100:.2f}%")
        print(f"[INFO] Fake probability: {fake_probability*100:.2f}%")
        print(f"[INFO] Using fake threshold: {FAKE_THRESHOLD*100}% (High sensitivity - catches 74% of fakes)")
        
        return jsonify({
            'success': True,
            'is_genuine': is_genuine,
            'confidence': round(confidence, 2),
            'prediction': predicted_class,
            'probabilities': {
                'real': round(real_probability * 100, 2),
                'fake': round(fake_probability * 100, 2)
            },
            'threshold_used': FAKE_THRESHOLD,
            'message': f"Product appears to be {'GENUINE (Real)' if is_genuine else 'FAKE'} with {confidence:.1f}% confidence"
        })
    except Exception as e:
        print(f"[ERROR] Error during prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500

@app.route('/api/model-info', methods=['GET'])
def model_info():
    return jsonify({
        'model_type': 'EfficientNetB3 (Transfer Learning) - HIGH-ACCURACY',
        'model_version': 'Phase 2 Training - Fine-tuned (Latest)',
        'image_size': IMAGE_SIZE,
        'model_file': 'model_phase2_high_accuracy_weights.h5',
        'weights_path': WEIGHTS_PATH,
        'config_path': CONFIG_PATH,
        'classes': CLASS_NAMES,
        'fake_threshold': FAKE_THRESHOLD,
        'security': {
            'rate_limiting': True,
            'max_requests_per_minute': RATE_LIMIT_REQUESTS,
            'max_file_size_mb': MAX_FILE_SIZE // (1024 * 1024),
            'allowed_file_types': list(ALLOWED_EXTENSIONS)
        },
        'training_info': {
            'base_model': 'EfficientNetB3 (ImageNet pre-trained)',
            'training_technique': 'Two-Phase Training with Focal Loss + Fine-tuning',
            'focal_alpha': config.get('focal_alpha', 0.75) if config else 0.75,
            'focal_gamma': config.get('focal_gamma', 2.0) if config else 2.0,
            'custom_threshold': 0.30,
            'dataset_balance': 'Balanced with class weights',
            'phase1_strategy': 'Frozen base model - 50 epochs',
            'phase2_strategy': 'Fine-tuned last 50 layers - 30 epochs',
            'performance_metrics': {
                'fake_recall': 0.7414,
                'real_recall': 0.7744,
                'fake_precision': 0.6866,
                'real_precision': 0.8179,
                'overall_accuracy': 0.7612,
                'overall_precision': 0.7654,
                'note': 'Balanced performance optimized for fake detection (74% fake recall)'
            }
        },
        'status': 'Model loaded and ready' if model is not None else 'Model not loaded'
    })

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🤖 AI Product Verification Server - HIGH-ACCURACY MODEL")
    print("="*70)
    print(f"Model: EfficientNetB3 (Two-Phase Training)")
    print(f"Version: Phase 2 Fine-tuned - LATEST (Blockchain + AI)")
    print(f"Image Size: {IMAGE_SIZE}x{IMAGE_SIZE}")
    print(f"Classes: {CLASS_NAMES}")
    print(f"Fake Threshold: {FAKE_THRESHOLD*100}% (High sensitivity for fake detection)")
    print(f"Model Status: {'✅ Loaded' if model is not None else '❌ Not Loaded'}")
    print(f"\n🔒 Security Features:")
    print(f"   ✅ Rate Limiting: {RATE_LIMIT_REQUESTS} requests per {RATE_LIMIT_WINDOW} seconds")
    print(f"   ✅ Max File Size: {MAX_FILE_SIZE // (1024*1024)}MB")
    print(f"   ✅ Allowed Types: {', '.join(ALLOWED_EXTENSIONS)}")
    print(f"\n📊 Performance Metrics (Validated):")
    print(f"   🔴 Fake Recall: 74.14% | Precision: 68.66%")
    print(f"   🟢 Real Recall: 77.44% | Precision: 81.79%")
    print(f"   ⚪ Overall Accuracy: 76.12% | Precision: 76.54%")
    print(f"\n💡 Model Characteristics:")
    print(f"   ✅ Balanced performance for both fake and real products")
    print(f"   ✅ Suitable for production blockchain + AI integration")
    print(f"   ✅ Catches 74% of fake products with acceptable precision")
    print(f"   ✅ Two-phase training: frozen base + fine-tuning (50 layers)")
    print("="*70)
    print("\n🌐 Endpoints:")
    print("  GET  /api/health       - Health check")
    print("  GET  /api/model-info   - Model information & metrics")
    print("  POST /api/verify-image - Verify product image")
    print("\n" + "="*70)
    print("🚀 Server starting on http://localhost:5000")
    print("="*70 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)