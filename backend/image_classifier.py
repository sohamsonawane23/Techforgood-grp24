import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing import image as keras_image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input, decode_predictions
import numpy as np
from PIL import Image
import io
import os

# Load pre-trained MobileNetV2 model
model = MobileNetV2(weights='imagenet')

# Define civic issue keywords to map ImageNet predictions to categories
CATEGORY_MAPPING = {
    'pothole': ['pothole', 'road', 'pavement', 'asphalt', 'street', 'crack', 'damage'],
    'streetlight': ['light', 'street light', 'lamp', 'lighting', 'pole', 'traffic light'],
    'garbage': ['trash', 'garbage', 'can', 'waste', 'bin', 'refuse', 'litter'],
    'drainage': ['drain', 'sewer', 'water', 'flooding', 'drain pipe', 'manhole', 'gutter'],
    'traffic': ['traffic', 'sign', 'vehicle', 'car', 'road marking', 'intersection'],
    'water_supply': ['pipe', 'water', 'faucet', 'tap', 'hydrant', 'connection'],
    'other': []
}

def classify_image(image_file_path: str):
    """
    Classify civic issue from image using pre-trained MobileNetV2 model.
    
    Args:
        image_file_path: Path to the uploaded image file
        
    Returns:
        Tuple of (category, confidence_score)
    """
    try:
        # Load and preprocess image
        img = keras_image.load_img(image_file_path, target_size=(224, 224))
        img_array = keras_image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        
        # Get predictions from ImageNet model
        predictions = model.predict(img_array, verbose=0)
        decoded_predictions = decode_predictions(predictions, top=5)[0]
        
        # Extract top predictions
        top_predictions = []
        for label, pred_class, score in decoded_predictions:
            top_predictions.append({
                'label': label.lower(),
                'score': float(score)
            })
        
        # Map predictions to civic categories
        category_scores = {cat: 0.0 for cat in CATEGORY_MAPPING.keys()}
        
        for prediction in top_predictions:
            pred_label = prediction['label'].lower()
            score = prediction['score']
            
            for category, keywords in CATEGORY_MAPPING.items():
                for keyword in keywords:
                    if keyword.lower() in pred_label:
                        category_scores[category] += score
                        break
        
        # Find best matching category
        best_category = max(category_scores, key=category_scores.get)
        confidence = category_scores[best_category]
        
        # If confidence is very low, classify as 'other'
        if confidence < 0.1:
            best_category = 'other'
            confidence = 0.0
        
        return best_category.replace('_', ' ').title(), confidence
        
    except Exception as e:
        print(f"Image Classification Error: {e}")
        return "Other", 0.0

def get_priority_from_category(category: str) -> str:
    """
    Determine priority level based on category.
    
    Args:
        category: The civic issue category
        
    Returns:
        Priority level: 'Low', 'Medium', or 'High'
    """
    high_priority = ['pothole', 'streetlight', 'drainage']
    medium_priority = ['garbage', 'water supply', 'traffic']
    
    category_lower = category.lower()
    
    if any(cat in category_lower for cat in high_priority):
        return 'High'
    elif any(cat in category_lower for cat in medium_priority):
        return 'Medium'
    else:
        return 'Low'

def classify_complaint_with_image(title: str, description: str, image_file_path: str):
    """
    Classify complaint using image analysis and text fallback.
    
    Args:
        title: Complaint title
        description: Complaint description
        image_file_path: Path to the uploaded image
        
    Returns:
        Tuple of (category, priority)
    """
    try:
        # Try image-based classification first
        if image_file_path and os.path.exists(image_file_path):
            category, confidence = classify_image(image_file_path)
            
            # If image confidence is good, use it
            if confidence > 0.15 or category.lower() != 'other':
                priority = get_priority_from_category(category)
                return category, priority
        
        # Fallback to text-based classification if image confidence is low
        from ai_service import classify_complaint
        category, priority = classify_complaint(title, description)
        return category, priority
        
    except Exception as e:
        print(f"Classification Error: {e}")
        # Ultimate fallback - use text-based classification
        try:
            from ai_service import classify_complaint
            category, priority = classify_complaint(title, description)
            return category, priority
        except:
            return "Uncategorized", "Medium"
