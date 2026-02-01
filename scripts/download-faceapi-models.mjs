/**
 * Downloads the minimum required face-api.js weights into `public/models/`.
 *
 * Why: emotion detection can look "broken" if the models are missing OR if the weights
 * don't match the installed library version. This script pulls from the official repo
 * used by face-api.js.
 *
 * Run:
 *   npm run setup:models
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const DEST_DIR = path.join(ROOT, "public", "models");

const BASE_URL =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

const FILES = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_expression_model-weights_manifest.json",
  "face_expression_model-shard1",
];

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(destPath, () => reject(err));
      });
  });
}

async function main() {
  fs.mkdirSync(DEST_DIR, { recursive: true });

  console.log(`Downloading face-api.js models into: ${DEST_DIR}`);
  for (const f of FILES) {
    const url = `${BASE_URL}/${f}`;
    const dest = path.join(DEST_DIR, f);
    console.log(`- ${f}`);
    await download(url, dest);
  }

  console.log("Done. You can now run the frontend and enable the camera.");
}

main().catch((err) => {
  console.error("Model download failed:", err);
  process.exit(1);
});

