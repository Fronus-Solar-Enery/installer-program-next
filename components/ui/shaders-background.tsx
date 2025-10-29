/* eslint-disable @typescript-eslint/no-explicit-any */
/* 
Fixed eslint "Expected an assignment or function call and instead saw an expression" by replacing `x && x()` style expressions with explicit typeof checks and calls.
*/
"use client";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

type DottedSurfaceProps = Omit<React.ComponentProps<"div">, "ref">;

export function ShadersBackground({ className, ...props }: DottedSurfaceProps) {
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points[];
    animationId: number | null;
    count: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(scene.fog.color, 0);

    container.appendChild(renderer.domElement);

    // Create particles
    const particles: THREE.Points[] = [];
    const positions: number[] = [];
    const colors: number[] = [];

    // Create geometry for all particles
    const geometry = new THREE.BufferGeometry();

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const y = 0; // Will be animated
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        positions.push(x, y, z);
        if (isDark) {
          colors.push(200, 200, 200);
        } else {
          colors.push(0, 0, 0);
        }
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const textureLoader = new THREE.TextureLoader();
    const circleTexture = textureLoader.load(
      isDark ? "/favicon.svg" : "/favicon.svg"
    );
    // Create material
    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      map: circleTexture,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    // Create points object
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;
    let animationId: number = 0; // initialize to avoid "used before assigned"

    // Animation function
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const positionAttribute = geometry.attributes.position;
      const positionsArr = positionAttribute.array as Float32Array;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const index = i * 3;

          // Animate Y position with sine waves
          positionsArr[index + 1] =
            Math.sin((ix + count) * 0.3) * 50 +
            Math.sin((iy + count) * 0.5) * 50;

          i++;
        }
      }

      positionAttribute.needsUpdate = true;

      renderer.render(scene, camera);
      count += 0.1;
    };

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Start animation (animationId will be set synchronously by requestAnimationFrame)
    animate();

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles: [points],
      animationId,
      count,
    };

    // Cleanup function - closes over stable `container` and `animationId`
    return () => {
      window.removeEventListener("resize", handleResize);

      // cancel the animation frame using the animationId variable that this closure captured
      if (animationId) {
        cancelAnimationFrame(animationId);
      } else if (sceneRef.current?.animationId) {
        // fallback if for any reason animationId isn't set yet
        cancelAnimationFrame(sceneRef.current.animationId);
      }

      // Clean up Three.js objects (use explicit typeof checks to avoid eslint unused-expression complaints)
      try {
        scene.traverse((obj: THREE.Object3D) => {
          if (obj instanceof THREE.Points) {
            // dispose geometry if available and disposable
            const geom = obj.geometry as THREE.BufferGeometry | undefined;
            if (geom && typeof (geom as any).dispose === "function") {
              (geom as any).dispose();
            }

            // dispose material(s)
            const mat = obj.material;
            if (Array.isArray(mat)) {
              mat.forEach((m) => {
                if (m && typeof (m as any).dispose === "function") {
                  (m as any).dispose();
                }
              });
            } else if (mat && typeof (mat as any).dispose === "function") {
              (mat as any).dispose();
            }
          }
        });
      } catch {
        // swallow errors during unmount cleanup
      }

      renderer.dispose();

      if (
        container &&
        renderer.domElement &&
        container.contains(renderer.domElement)
      ) {
        container.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
    };
    // only re-run when theme changes
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none fixed inset-0 -z-1", className)}
      {...props}
    />
  );
}
