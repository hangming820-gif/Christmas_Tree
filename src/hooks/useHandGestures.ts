import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { HAND_OPEN_SCALE } from "../lib/constants";
import type { CameraStatus, HandGesture } from "../types";

const distance = (first: NormalizedLandmark, second: NormalizedLandmark) =>
  Math.hypot(first.x - second.x, first.y - second.y);

const countExtendedFingers = (landmarks: NormalizedLandmark[]) => {
  const wrist = landmarks[0];
  const fingerPairs = [
    [5, 8],
    [9, 12],
    [13, 16],
    [17, 20],
  ];

  return fingerPairs.reduce((count, [mcpIndex, tipIndex]) => {
    const mcp = landmarks[mcpIndex];
    const tip = landmarks[tipIndex];
    return distance(wrist, tip) > distance(wrist, mcp) * 1.18
      ? count + 1
      : count;
  }, 0);
};

export function useHandGestures() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<CameraStatus>("off");
  const [gesture, setGesture] = useState<HandGesture>("IDLE");
  const [handX, setHandX] = useState(0);
  const [scaleTarget, setScaleTarget] = useState(1);

  useEffect(() => {
    if (!enabled) {
      setStatus("off");
      setGesture("IDLE");
      setHandX(0);
      setScaleTarget(1);
      return;
    }

    let cancelled = false;
    let animationFrame = 0;
    let stream: MediaStream | null = null;
    let landmarker: HandLandmarker | null = null;
    let lastUiUpdate = 0;

    const releaseCamera = () => {
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const start = async () => {
      setStatus("requesting");

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (cancelled) {
          releaseCamera();
          return;
        }

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const vision = await FilesetResolver.forVisionTasks(
          `${import.meta.env.BASE_URL}mediapipe/wasm`,
        );
        const modelOptions = {
          modelAssetPath: `${import.meta.env.BASE_URL}models/hand_landmarker.task`,
        };
        const landmarkerOptions = {
          runningMode: "VIDEO" as const,
          numHands: 1,
          minHandDetectionConfidence: 0.56,
          minHandPresenceConfidence: 0.54,
          minTrackingConfidence: 0.54,
        };

        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            ...landmarkerOptions,
            baseOptions: { ...modelOptions, delegate: "GPU" },
          });
        } catch {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            ...landmarkerOptions,
            baseOptions: { ...modelOptions, delegate: "CPU" },
          });
        }

        if (cancelled) {
          landmarker.close();
          return;
        }
        setStatus("ready");

        const detect = () => {
          if (cancelled || !landmarker) return;
          const currentVideo = videoRef.current;
          const now = performance.now();

          if (
            currentVideo &&
            currentVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
          ) {
            const result = landmarker.detectForVideo(currentVideo, now);
            const landmarks = result.landmarks[0];

            if (landmarks && now - lastUiUpdate > 65) {
              const extended = countExtendedFingers(landmarks);
              const nextGesture: HandGesture =
                extended >= 3
                  ? "OPEN"
                  : extended <= 1
                    ? "CLOSED"
                    : "NEUTRAL";
              const palmCenter =
                (landmarks[9].x + landmarks[13].x + landmarks[0].x) / 3;
              const nextHandX = Math.max(
                -1,
                Math.min(1, (0.5 - palmCenter) * 3.3),
              );

              setGesture(nextGesture);
              setHandX(nextHandX);
              if (nextGesture === "OPEN") {
                setScaleTarget(HAND_OPEN_SCALE);
              } else if (nextGesture === "CLOSED") {
                setScaleTarget(1);
              }
              lastUiUpdate = now;
            } else if (!landmarks && now - lastUiUpdate > 220) {
              setGesture("IDLE");
              setHandX(0);
              lastUiUpdate = now;
            }
          }

          animationFrame = requestAnimationFrame(detect);
        };

        detect();
      } catch (error) {
        if (cancelled) return;
        releaseCamera();
        const permissionDenied =
          error instanceof DOMException &&
          (error.name === "NotAllowedError" ||
            error.name === "PermissionDeniedError");
        setStatus(permissionDenied ? "denied" : "error");
        setGesture("IDLE");
        setScaleTarget(1);
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      landmarker?.close();
      releaseCamera();
    };
  }, [enabled]);

  return {
    videoRef,
    enabled,
    setEnabled,
    status,
    gesture,
    handX,
    scaleTarget,
  };
}

