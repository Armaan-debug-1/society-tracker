import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const ParticleBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      className="absolute inset-0 w-full h-full z-0"
      options={{
        background: {
          color: { value: "transparent" },
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "repulse", 
            },
            resize: true,
          },
          modes: {
            repulse: {
              distance: 120,
              duration: 0.4,
            },
          },
        },
        particles: {
          // ✨ MULTI-COLOR MAGIC ADDED HERE ✨
          color: { 
            value: ["#06b6d4", "#6366f1", "#8b5cf6", "#ffffff"] // Cyan, Indigo, Purple, White
          },
          move: {
            direction: "none",
            enable: true,
            outModes: { default: "bounce" },
            random: true,
            speed: 1.5, 
            straight: false,
          },
          number: {
            density: { enable: true, area: 800 },
            value: 250, 
          },
          opacity: {
            value: { min: 0.3, max: 0.9 }, // Thoda bright kar diya colors dikhane ke liye
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 0.2,
            },
          },
          shape: { type: "circle" },
          size: { 
            value: { min: 1, max: 2.5 } // Size halka sa increase kiya taaki color pop ho
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticleBackground;