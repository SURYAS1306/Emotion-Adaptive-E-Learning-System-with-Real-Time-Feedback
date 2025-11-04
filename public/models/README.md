# Face Detection Models

This folder needs to contain the face-api.js models for facial emotion detection to work.

## How to add the models:

1. Download the models from the face-api.js repository:
   - Go to: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
   
2. Download these specific files and place them in this `/public/models/` folder:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_expression_model-weights_manifest.json`
   - `face_expression_model-shard1`

3. Once the files are in place, the facial emotion detection will work automatically.

## Alternative: Use CDN (temporary for testing)

You can also modify `src/utils/emotionDetection.ts` to load models from a CDN:

```typescript
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
```

Note: Using CDN may be slower than hosting the models locally.
