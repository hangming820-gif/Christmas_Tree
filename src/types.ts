export interface Wish {
  id: number;
  message: string;
  offsetX: number;
}

export type HandGesture = "IDLE" | "OPEN" | "CLOSED" | "NEUTRAL";

export type CameraStatus =
  | "off"
  | "requesting"
  | "ready"
  | "denied"
  | "error";

