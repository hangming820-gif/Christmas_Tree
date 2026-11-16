import type { RefObject } from "react";
import type { CameraStatus, HandGesture } from "../types";

interface HandControlProps {
  videoRef: RefObject<HTMLVideoElement>;
  enabled: boolean;
  status: CameraStatus;
  gesture: HandGesture;
  scaleTarget: number;
  onToggle: () => void;
}

const statusLabel = (
  status: CameraStatus,
  gesture: HandGesture,
  enabled: boolean,
) => {
  if (status === "requesting") return "CALIBRATING";
  if (status === "denied") return "CAMERA BLOCKED";
  if (status === "error") return "CAMERA UNAVAILABLE";
  if (!enabled || status === "off") return "HAND CONTROL";
  if (gesture === "OPEN") return "OPEN · UNLEASH";
  if (gesture === "CLOSED") return "CLOSED · GATHER";
  if (gesture === "NEUTRAL") return "HAND DETECTED";
  return "SHOW YOUR HAND";
};

export function HandControl({
  videoRef,
  enabled,
  status,
  gesture,
  scaleTarget,
  onToggle,
}: HandControlProps) {
  const ready = status === "ready";

  return (
    <aside className={`hand-control ${enabled ? "is-active" : ""}`}>
      <button
        type="button"
        className="hand-toggle"
        aria-pressed={enabled}
        onClick={onToggle}
      >
        <span className="camera-glyph" aria-hidden="true">
          <span />
        </span>
        <span className="camera-copy">
          <span className="camera-label">CAMERA</span>
          <span className="camera-status">
            {statusLabel(status, gesture, enabled)}
          </span>
        </span>
        <span className="toggle-track" aria-hidden="true">
          <span className="toggle-thumb" />
        </span>
      </button>

      {enabled && (
        <div className="camera-disclosure">
          <div className="camera-preview">
            <video
              ref={videoRef}
              className="camera-video"
              muted
              playsInline
              aria-label="Live hand tracking preview"
            />
            <span className="camera-scanline" />
            <span className="camera-corner camera-corner-one" />
            <span className="camera-corner camera-corner-two" />
            {!ready && <span className="camera-waiting">···</span>}
          </div>
          <div className="hand-readout">
            <span>{gesture === "OPEN" ? "3.0×" : gesture === "CLOSED" ? "1.0×" : `${scaleTarget.toFixed(1)}×`}</span>
            <span className="hand-readout-rule" />
            <span>{ready ? "TRACKING LIVE" : "STANDBY"}</span>
          </div>
          <p className="hand-hint">
            Open hand to unleash. Close to gather. Move to orbit.
          </p>
        </div>
      )}
    </aside>
  );
}

