"use client";

import * as React from "react";

import { detectFaceFromDataUrl } from "@/lib/faceAnalysis/detect";
import { FaceNotDetectedError, type DetectResult } from "@/lib/faceAnalysis/types";

export type DetectionStatus = "idle" | "loading" | "success" | "error";

export type UseFaceLandmarkerResult = {
  status: DetectionStatus;
  result: DetectResult | null;
  error: string | null;
  detect: (dataUrl: string) => Promise<DetectResult | null>;
  reset: () => void;
};

export function useFaceLandmarker(): UseFaceLandmarkerResult {
  const [status, setStatus] = React.useState<DetectionStatus>("idle");
  const [result, setResult] = React.useState<DetectResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const tokenRef = React.useRef(0);

  const reset = React.useCallback(() => {
    tokenRef.current += 1;
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const detect = React.useCallback(
    async (dataUrl: string): Promise<DetectResult | null> => {
      const token = ++tokenRef.current;
      setStatus("loading");
      setError(null);
      setResult(null);

      try {
        const detection = await detectFaceFromDataUrl(dataUrl);
        if (tokenRef.current !== token) return null;
        setResult(detection);
        setStatus("success");
        return detection;
      } catch (e) {
        if (tokenRef.current !== token) return null;
        const message =
          e instanceof FaceNotDetectedError
            ? e.message
            : e instanceof Error
              ? e.message
              : "顔解析に失敗しました。もう一度お試しください。";
        setError(message);
        setStatus("error");
        return null;
      }
    },
    [],
  );

  return { status, result, error, detect, reset };
}
