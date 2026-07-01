import json
import os

import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.utils import load_img, img_to_array

# --- Model loading -------------------------------------------------------
#
# This uses a custom-trained classifier (transfer learning on top of a
# frozen MobileNetV2 backbone, with a small trained head for our 9 civic
# categories) instead of raw ImageNet/MobileNetV2 keyword-matching. It
# actually recognizes civic-issue classes directly, rather than guessing
# from generic object labels - so no keyword-mapping step is needed.
#
# The model is loaded once at import time and reused for every request.
# If the .h5 file is missing or fails to load, MODEL stays None and
# classify_image() falls back to "Other" with 0 confidence rather than
# crashing the whole app at startup.

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "civic_issue_classifier.h5")
LABELS_PATH = os.path.join(os.path.dirname(__file__), "model_labels.json")

IMG_SIZE = (224, 224)

MODEL = None
CLASS_LABELS = []

try:
    MODEL = load_model(MODEL_PATH, compile=False)
except Exception as e:
    print(f"WARNING: Could not load image classification model at {MODEL_PATH}: {e}")
    print("Image classification will be unavailable; complaints will fall back to text-based classification.")

try:
    with open(LABELS_PATH, "r") as f:
        CLASS_LABELS = json.load(f)["classes"]
except Exception as e:
    print(f"WARNING: Could not load model_labels.json at {LABELS_PATH}: {e}")

if MODEL is not None and CLASS_LABELS:
    model_output_size = MODEL.output_shape[-1]
    if model_output_size != len(CLASS_LABELS):
        print(
            f"WARNING: model_labels.json has {len(CLASS_LABELS)} classes but the "
            f"model outputs {model_output_size}. Truncating the label list to match "
            f"the model's actual output size - extra labels beyond that point are "
            f"unreachable since the model was never trained to predict them."
        )
        CLASS_LABELS = CLASS_LABELS[:model_output_size]


def classify_image(image_file_path: str):
    """
    Classify a civic issue photo using the custom-trained model.

    Args:
        image_file_path: Path to the uploaded image file

    Returns:
        Tuple of (category, confidence_score) where confidence_score is
        the model's softmax probability for the predicted class (0.0-1.0).
    """
    if MODEL is None or not CLASS_LABELS:
        return "Other", 0.0

    try:
        img = load_img(image_file_path, target_size=IMG_SIZE)
        img_array = img_to_array(img) / 255.0  # must match training-time normalization
        img_array = np.expand_dims(img_array, axis=0)

        predictions = MODEL.predict(img_array, verbose=0)[0]
        top_idx = int(np.argmax(predictions))
        confidence = float(predictions[top_idx])
        category = CLASS_LABELS[top_idx]

        return category, confidence

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
    category_lower = category.lower()

    high_priority_keywords = [
        "pothole", "damaged road", "broken road sign", "dead animal", "vandalism",
    ]
    medium_priority_keywords = [
        "littering", "garbage", "illegal parking", "damaged concrete", "fallen tree",
    ]

    if any(kw in category_lower for kw in high_priority_keywords):
        return "High"
    elif any(kw in category_lower for kw in medium_priority_keywords):
        return "Medium"
    else:
        return "Low"


def classify_complaint_with_image(title: str, description: str, image_file_path: str):
    """
    Classify complaint using the custom image model, with a text-based
    fallback if no image was provided, the model isn't loaded, or
    confidence is too low to trust.

    Args:
        title: Complaint title
        description: Complaint description
        image_file_path: Path to the uploaded image

    Returns:
        Tuple of (category, priority)
    """
    # This is a real trained classifier for our exact categories (not a
    # general-purpose ImageNet keyword guess), so we can trust a lower
    # confidence bar than the old MobileNetV2-keyword approach used.
    CONFIDENCE_THRESHOLD = 0.5

    try:
        if image_file_path and os.path.exists(image_file_path):
            category, confidence = classify_image(image_file_path)

            if category.lower() != "other" and confidence >= CONFIDENCE_THRESHOLD:
                priority = get_priority_from_category(category)
                return category, priority
            # Otherwise fall through to text-based classification below.

        from ai_service import classify_complaint
        category, priority = classify_complaint(title, description)
        return category, priority

    except Exception as e:
        print(f"Classification Error: {e}")
        try:
            from ai_service import classify_complaint
            category, priority = classify_complaint(title, description)
            return category, priority
        except Exception:
            return "Uncategorized", "Medium"
