"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function Globe() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 8000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Campo Estelar Cinematográfico (12,000 partículas)
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 0.6, 
      transparent: true, 
      opacity: 0.8 
    });
    const starVertices = [];
    for (let i = 0; i < 12000; i++) {
      const x = (Math.random() - 0.5) * 5000;
      const y = (Math.random() - 0.5) * 5000;
      const z = (Math.random() - 0.5) * 5000;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Iluminación Táctica
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.8);
    sunLight.position.set(50, 40, 60);
    scene.add(sunLight);

    const globeRadius = 3.5;
    const moonGroup = new THREE.Group();
    scene.add(moonGroup);

    // Texturas de Respaldo Científicas (NASA SVS #14959)
    const textureLoader = new THREE.TextureLoader();
    const colorMap = textureLoader.load('https://svs.gsfc.nasa.gov/vis/a010000/a014900/a014959/color_2048.jpg');
    const displacementMap = textureLoader.load('https://svs.gsfc.nasa.gov/vis/a010000/a014900/a014959/ldem_2048.jpg');

    // Carga del Modelo 8K con Fallback Robusto
    const loader = new GLTFLoader();
    loader.load('/models/Moon_NASA_LRO_8k_Topo.glb', (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: colorMap,
            bumpMap: displacementMap,
            bumpScale: 0.08,
            roughness: 0.9,
          });
        }
      });
      moonGroup.add(model);
    }, undefined, () => {
      // Si el binario 8K falla, generamos la esfera con el geoide lunar de la NASA
      const geometry = new THREE.SphereGeometry(globeRadius, 128, 128);
      const material = new THREE.MeshStandardMaterial({ 
        map: colorMap,
        bumpMap: displacementMap,
        bumpScale: 0.12,
        roughness: 0.92
      });
      moonGroup.add(new THREE.Mesh(geometry, material));
    });

    camera.position.z = 12;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.08;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}