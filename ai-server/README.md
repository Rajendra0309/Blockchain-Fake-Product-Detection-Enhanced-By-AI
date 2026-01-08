# AI Product Verification Server

Flask API for fake product detection using trained AI model.

## Setup

```bash
pip install -r requirements.txt
python app.py
```

Server runs at `http://localhost:5000`

## API Endpoints

**POST /api/verify-image** - Upload product image for verification
```json
Response: {
  "is_genuine": true,
  "confidence": 95.5
}
```

**GET /api/health** - Check server status

---