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
            onHover: { enable: true, mode: "repulse" },
            resize: true,
          },
          modes: {
            repulse: { distance: 120, duration: 0.4 },
          },
        },
        particles: {
          // ✨ Deep Space Star Palette: White, Bright Cyan, Sky Blue, Soft Indigo
          color: { 
            value: ["#ffffff", "#22d3ee", "#38bdf8", "#818cf8"] 
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
            // YAHAN CHANGE KIYA HAI: 250 se 100 kar diya
            value: 100, 
          },
          opacity: {
            value: { min: 0.2, max: 0.8 },
            animation: { enable: true, speed: 1, minimumValue: 0.1 },
          },
          shape: { type: "circle" },
          size: { value: { min: 0.5, max: 2.0 } },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticleBackground;
