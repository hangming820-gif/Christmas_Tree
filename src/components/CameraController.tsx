import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function CameraController() {
  const { camera, gl, size } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    const mobile = size.width < 720;
    camera.position.set(
      mobile ? 1.3 : 2.45,
      mobile ? 0.9 : 1.25,
      mobile ? 13.2 : 11.75,
    );
    controls.target.set(0, 0.08, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.autoRotate = false;
    controls.minDistance = mobile ? 7.4 : 6.5;
    controls.maxDistance = 16;
    controls.minPolarAngle = Math.PI * 0.29;
    controls.maxPolarAngle = Math.PI * 0.67;
    controls.rotateSpeed = 0.46;
    controls.zoomSpeed = 0.68;
    controls.update();
    controlsRef.current = controls;

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl, size.width]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return null;
}

