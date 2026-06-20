# Image Classification Integration Guide

## Overview
This guide explains how the image classification system works in your Techforgood civic complaint app.

## What Changed

### New Files Added
1. **`backend/image_classifier.py`** - TensorFlow-based image classification module
2. **`backend/requirements.txt`** - All Python dependencies

### Modified Files
1. **`backend/routers/complaints.py`** - Now uses image classification instead of text-only

## How It Works

### Classification Flow

```
User uploads complaint with image
         ↓
Image saved to /uploads/ folder
         ↓
classify_complaint_with_image() called
         ↓
TensorFlow MobileNetV2 model analyzes image
         ↓
Image features matched to civic categories:
  - Pothole
  - Streetlight
  - Garbage
  - Drainage
  - Traffic
  - Water Supply
  - Other
         ↓
If confidence > 0.15:
  Use image-based category & priority
         ↓
Else:
  Fallback to Gemini AI text-based classification
         ↓
Store complaint with category & priority in database
```

### Civic Categories & Auto-Priority

| Category | Priority | Keywords |
|----------|----------|----------|
| **Pothole** | High | pothole, road damage, asphalt crack |
| **Streetlight** | High | street light, lamp, pole, lighting |
| **Garbage** | Medium | trash, garbage can, waste, litter |
| **Drainage** | High | drain, sewer, flooding, manhole |
| **Traffic** | Medium | traffic sign, vehicle, road marking |
| **Water Supply** | Medium | pipe, water, faucet, tap |
| **Other** | Low | anything else |

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note:** TensorFlow is ~500MB, so first installation may take a few minutes.

### 2. Environment Variables

Make sure you have your Gemini API key set (for text fallback):

```bash
export GEMINI_API_KEY="your_api_key_here"
```

### 3. Run the Backend

```bash
cd backend
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## Key Features

### ✅ Automatic Image Classification
- Pre-trained **MobileNetV2** model (lightweight, fast)
- ImageNet predictions mapped to civic categories
- Confidence scoring (0-1 scale)

### ✅ Intelligent Fallback
- If image classification confidence is low (< 0.15), uses text-based Gemini AI
- Ensures reliability even with poor image quality

### ✅ Smart Priority Assignment
- Automatically assigns priority based on category
- High-priority issues: Pothole, Streetlight, Drainage
- Medium-priority: Garbage, Traffic, Water Supply

### ✅ Backward Compatible
- Works with or without images
- If no image uploaded, uses text-based classification
- Fallback to text if image processing fails

## How to Test

### 1. Test with cURL (via image)

```bash
curl -X POST "http://localhost:8000/api/complaints/" \
  -F "title=Broken Street Light" \
  -F "description=Street light near Main St is broken" \
  -F "image=@/path/to/image.jpg"
```

### 2. Test with Frontend
1. Open complaint form
2. Upload image of civic issue
3. Add title and description
4. Submit - watch it auto-categorize!

## Model Details

### MobileNetV2
- **Size:** ~100MB (after download)
- **Speed:** ~100-200ms per image
- **Accuracy:** Trained on 1.4M ImageNet images
- **Trade-off:** Fast & lightweight vs highly specialized

### Why MobileNetV2?
- ✅ Fast inference (suitable for web)
- ✅ Small model size
- ✅ Good general-purpose object recognition
- ✅ Pre-trained weights available

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'tensorflow'"
**Solution:** Run `pip install -r requirements.txt` again

### Issue: Image classification returns "Other"
**Possible causes:**
- Poor image quality
- Image doesn't match civic issues
- Object not recognized by ImageNet

**Solution:** System automatically falls back to text-based classification

### Issue: Slow inference on first request
**Why:** Model loads on first request (~2-3 seconds)
**Solution:** Normal behavior - subsequent requests are faster due to model caching

## Going Back to Original Version

If you want to revert to text-only classification:

```bash
# Switch to backup branch
git checkout backup-original

# Or revert specific files
git checkout backup-original -- backend/routers/complaints.py
```

Then comment out image classification in `complaints.py`:
```python
# category, priority = classify_complaint_with_image(title, description, image_path)
category, priority = classify_complaint(title, description)  # Text-only
```

## Future Enhancements

### Option 1: Custom Model
- Train a model specifically on civic issue images
- Would improve accuracy significantly
- Requires labeled training dataset

### Option 2: Combine Multiple Models
- Use MobileNetV2 + YOLO for object detection
- More robust categorization

### Option 3: Fine-tune MobileNetV2
- Transfer learning on civic issue dataset
- Best accuracy/speed trade-off

## API Response Example

```json
{
  "id": 1,
  "title": "Broken Street Light",
  "description": "Light near Main St not working",
  "category": "Streetlight",
  "priority": "High",
  "status": "Pending",
  "image_url": "/uploads/abc123.jpg",
  "created_at": "2026-06-19T05:30:00Z"
}
```

## Support

For issues or questions:
1. Check logs: `backend/image_classifier.py` prints detailed errors
2. Verify image format (JPG, PNG, GIF, BMP supported)
3. Ensure Gemini API key is set for fallback classification
