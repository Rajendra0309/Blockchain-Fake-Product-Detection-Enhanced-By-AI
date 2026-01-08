# AI Server Setup Guide

## Overview
Flask server for fake product detection using trained EfficientNetB3 model.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Start server
python app.py
# Runs at http://localhost:5000
```

## API Endpoints

**Health Check:**
```
GET /api/health
```

**Verify Product Image:**
```
POST /api/verify-image
Body: multipart/form-data with image file
```

**Response:**
```json
{
  "is_genuine": true,
  "confidence": 92.45,
  "prediction": "real"
}
```