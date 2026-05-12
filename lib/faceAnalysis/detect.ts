// 顔検出を行うための関数
import { getFaceLandmarker } from "@/lib/faceAnalysis/landmarker";
import { FaceNotDetectedError, type DetectResult, type Landmark } from "@/lib/faceAnalysis/types";

// データURLから画像を読み込むための関数
export async function loadImageFromDataUrl(
  dataUrl: string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("画像のデコードに失敗しました。別の写真をお試しください。"));
    img.src = dataUrl;
  });
}

// 最も大きい顔を検出するための関数
function pickLargestFace(allLandmarks: Landmark[][]): Landmark[] {
  if (allLandmarks.length === 1) return allLandmarks[0];

  let bestIndex = 0;
  let bestSpan = -Infinity;
  for (let i = 0; i < allLandmarks.length; i += 1) {
    const lms = allLandmarks[i];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of lms) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const span = (maxX - minX) * (maxY - minY);
    if (span > bestSpan) {
      bestSpan = span;
      bestIndex = i;
    }
  }
  return allLandmarks[bestIndex];
}

// 顔検出を行うための関数
export async function detectFace(
  image: HTMLImageElement | ImageBitmap | HTMLCanvasElement,
): Promise<DetectResult> {
  const landmarker = await getFaceLandmarker();

  const start = performance.now();
  const result = landmarker.detect(image);
  const durationMs = performance.now() - start;

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    throw new FaceNotDetectedError();
  }

  const landmarks = pickLargestFace(result.faceLandmarks);

  const width = "naturalWidth" in image ? image.naturalWidth : image.width;
  const height = "naturalHeight" in image ? image.naturalHeight : image.height;

  return {
    landmarks,
    imageWidth: width,
    imageHeight: height,
    durationMs,
  };
}

// データURLから顔検出を行うための関数
export async function detectFaceFromDataUrl(
  dataUrl: string,
): Promise<DetectResult> {
  const img = await loadImageFromDataUrl(dataUrl);
  return detectFace(img);
}
