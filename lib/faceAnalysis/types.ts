export type Landmark = {
  x: number;
  y: number;
  z: number;
};

export type DetectResult = {
  landmarks: Landmark[];
  imageWidth: number;
  imageHeight: number;
  durationMs: number;
};

export class FaceNotDetectedError extends Error {
  constructor(
    message = "写真から顔を検出できませんでした。明るい場所で正面から撮影した写真でお試しください。",
  ) {
    super(message);
    this.name = "FaceNotDetectedError";
  }
}
