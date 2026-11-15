'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LunarFeature, MapLayersConfig } from '@/types/lunar';
import { cartesianToGeodetic } from '@/lib/lunar-engine';
import { RotateCcw, ZoomIn, ZoomOut, Sun, Orbit } from 'lucide-react';
import { useGlobeTexture } from '@/hooks/use-globe-texture';
import { calculateLunarEphemeris, CelestialPositions } from '@/lib/lunar-ephemeris';
import SimulationControls from './SimulationControls';
import { getLGRSGridLines } from '@/lib/lgrs';

interface GlobeViewProps {
  features: LunarFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (id: string | null) => void;
  layers: MapLayersConfig;
  onInspectPoint?: (lat: number, lng: number, telemetry: CelestialPositions) => void;
  simTime: number;
  onSimTimeChange: (ts: number) => void;
  simSpeed: number;
  onSimSpeedChange: (s: number) => void;
  isSimActive: boolean;
  onToggleSim: () => void;
  isMini?: boolean;
}

export default function GlobeView({ 
  features, 
  selectedFeatureId, 
  onSelectFeature, 
  layers,
  onInspectPoint,
  simTime,
  onSimTimeChange,
  simSpeed,
  onSimSpeedChange,
  isSimActive,
  onToggleSim,
  isMini = false
}: GlobeViewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const moonMeshRef = useRef<THREE.Mesh | null>(null);
  const proxySphereRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sunGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const inspectorMarkerRef = useRef<THREE.Group | null>(null);
  const lgrsGroupRef = useRef<THREE.Group | null>(null);
  
  const dynamicTexture = useGlobeTexture(layers);
  const globeRadius = 16;

  // Ephemeris calculated from master simTime
  const ephemeris = useMemo(() => {
    return calculateLunarEphemeris(simTime || Date.now(), 120);
  }, [simTime]);

  const lastSunPos = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 10000);
    camera.position.set(0, 0, 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    mountRef.current.appendChild(renderer.domElement);

    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.8 });
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 8000;
      const y = (Math.random() - 0.5) * 8000;
      const z = (Math.random() - 0.5) * 8000;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    scene.add(new THREE.Points(starGeometry, starMaterial));

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(0xffffff, 4.0);
    sunLight.position.set(60, 40, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const sunGroup = new THREE.Group();
    const sunGeom = new THREE.SphereGeometry(4, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    sunGroup.add(new THREE.Mesh(sunGeom, sunMat));
    scene.add(sunGroup);
    sunGroupRef.current = sunGroup;

    const earthGeo = new THREE.SphereGeometry(6, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x4dabf7, roughness: 0.5 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthRef.current = earth;
    scene.add(earth);

    const inspectorMarker = new THREE.Group();
    inspectorMarker.add(new THREE.Mesh(new THREE.RingGeometry(0.3, 0.35, 32), new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide })));
    scene.add(inspectorMarker);
    inspectorMarkerRef.current = inspectorMarker;
    inspectorMarker.visible = false;

    const lgrsGroup = new THREE.Group();
    scene.add(lgrsGroup);
    lgrsGroupRef.current = lgrsGroup;

    const material = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, color: 0xffffff });
    const proxySphereGeom = new THREE.SphereGeometry(globeRadius, 32, 32);
    const proxySphere = new THREE.Mesh(proxySphereGeom, new THREE.MeshBasicMaterial({ visible: false }));
    scene.add(proxySphere);
    proxySphereRef.current = proxySphere;

    const globeGeom = new THREE.SphereGeometry(globeRadius, 64, 64);
    const moon = new THREE.Mesh(globeGeom, material);
    moon.receiveShadow = true;
    moon.castShadow = true;
    moonMeshRef.current = moon;
    scene.add(moon);

    const loader = new GLTFLoader();
    loader.load('/models/Moon_NASA_LRO_8k_Topo.glb', (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.receiveShadow = true;
          child.castShadow = true;
          child.material = material;
          moonMeshRef.current = child;
        }
      });
      scene.remove(moon);
      scene.add(model);
    }, undefined, () => console.warn("Fallback to sphere."));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 20;
    controls.maxDistance = 1500;
    controlsRef.current = controls;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseClick = (event: MouseEvent) => {
      if (!mountRef.current || !proxySphereRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(proxySphereRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const geodetic = cartesianToGeodetic(point.x, point.y, point.z, globeRadius);
        if (inspectorMarkerRef.current) {
          inspectorMarkerRef.current.position.copy(point).multiplyScalar(1.01);
          inspectorMarkerRef.current.lookAt(0, 0, 0);
          inspectorMarkerRef.current.visible = true;
        }
        if (onInspectPoint) onInspectPoint(geodetic.lat, geodetic.lng, ephemeris);
      }
    };

    renderer.domElement.addEventListener('click', handleMouseClick);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const controlsChanged = controls.update();
      if (isSimActive || controlsChanged) {
        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener('click', handleMouseClick);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      starGeometry.dispose();
      starMaterial.dispose();
      material.dispose();
      earthMat.dispose();
      sunMat.dispose();
      renderer.dispose();
    };
  }, [isSimActive]);

  useEffect(() => {
    if (!lgrsGroupRef.current) return;
    const group = lgrsGroupRef.current;
    group.clear();
    if (!layers.lgrs?.active) return;

    const gridData = getLGRSGridLines(1, 'EQ');
    const material = new THREE.LineBasicMaterial({ 
      color: 0x4dabf7, 
      opacity: layers.lgrs.opacity, 
      transparent: true 
    });
    
    const points: THREE.Vector3[] = [];
    const radius = globeRadius * 1.002;

    // Helper to calculate cartesian from geodetic
    const getPos = (lat: number, lng: number) => {
      const phi = (lat * Math.PI) / 180;
      const theta = (lng * Math.PI) / 180;
      return new THREE.Vector3(
        radius * Math.cos(phi) * Math.cos(theta),
        radius * Math.sin(phi),
        radius * Math.cos(phi) * Math.sin(theta)
      );
    };

    // Draw Latitudes (Anillos)
    gridData.lat.forEach(latObj => {
      const lat = latObj.value;
      for (let lng = -180; lng < 180; lng += 5) {
        points.push(getPos(lat, lng), getPos(lat, lng + 5));
      }
    });

    // Draw Longitudes (Radios)
    gridData.lng.forEach(lngObj => {
      const lng = lngObj.value;
      for (let lat = -90; lat < 90; lat += 5) {
        points.push(getPos(lat, lng), getPos(lat + 5, lng));
      }
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineSegments = new THREE.LineSegments(geometry, material);
    group.add(lineSegments);
  }, [layers.lgrs, globeRadius]);

  const handleManualZoom = (factor: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object;
    const target = controls.target;
    const offset = new THREE.Vector3().subVectors(camera.position, target);
    offset.multiplyScalar(factor);
    camera.position.copy(target).add(offset);
    controls.update();
  };

  useEffect(() => {
    if (moonMeshRef.current && dynamicTexture) {
      const mat = moonMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.map = dynamicTexture;
      mat.needsUpdate = true;
    }
  }, [dynamicTexture]);

  useEffect(() => {
    if (!sunLightRef.current || !ambientLightRef.current || !earthRef.current || !sunGroupRef.current) return;
    
    if (isSimActive && simTime > 0) {
      ambientLightRef.current.intensity = 0.05;
      const [sx, sy, sz] = ephemeris.sunDirection;
      sunLightRef.current.position.set(sx * 300, sy * 300, sz * 300);
      sunGroupRef.current.position.set(sx * 400, sy * 400, sz * 400);
      sunGroupRef.current.visible = true;
      
      const [ex, ey, ez] = ephemeris.earthPosition;
      earthRef.current.position.set(ex, ey, ez);
      earthRef.current.visible = true;
      earthRef.current.lookAt(0, 0, 0);

      const dist = Math.sqrt(
        Math.pow(sx - lastSunPos.current[0], 2) + 
        Math.pow(sy - lastSunPos.current[1], 2) + 
        Math.pow(sz - lastSunPos.current[2], 2)
      );
      if (dist > 0.005) {
        const renderer = sunLightRef.current.parent?.children.find(c => c.type === 'WebGLRenderer') as any;
        if (renderer) renderer.shadowMap.needsUpdate = true;
        lastSunPos.current = [sx, sy, sz];
      }
    } else {
      ambientLightRef.current.intensity = 0.4;
      sunGroupRef.current.visible = false;
      earthRef.current.visible = false;
    }
  }, [isSimActive, ephemeris, simTime]);

  return (
    <div className="w-full h-full relative group bg-black overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {!isMini && (
        <div className="absolute bottom-14 left-6 z-[1000] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 text-[8px] md:text-[9px] text-white/40 uppercase tracking-[0.15em] font-mono shadow-2xl max-w-[80vw] md:max-w-none">
            3D model: NASA's Scientific Visualization Studio (Ernie Wright, USRA; Dan Gallagher), built from LRO data. Drag to rotate, scroll or pinch to zoom, click a point for its grid cell.
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-col gap-1 pointer-events-auto">
           <ControlBtn onClick={() => controlsRef.current?.reset()} icon={<RotateCcw className="w-3 h-3" />} />
           <ControlBtn onClick={() => handleManualZoom(0.8)} icon={<ZoomIn className="w-3 h-3" />} />
           <ControlBtn onClick={() => handleManualZoom(1.2)} icon={<ZoomOut className="w-3 h-3" />} />
           <div className="h-px bg-white/10 my-1" />
           <ControlBtn 
            onClick={onToggleSim} 
            icon={isSimActive ? <Sun className="w-3.5 h-3.5 text-blue-400" /> : <Orbit className="w-3.5 h-3.5" />} 
            active={isSimActive}
           />
        </div>
      </div>
      <SimulationControls 
        isActive={isSimActive}
        timestamp={simTime}
        onTimestampChange={onSimTimeChange}
        speed={simSpeed}
        onSpeedChange={onSimSpeedChange}
        onToggle={onToggleSim}
        telemetry={ephemeris}
      />
    </div>
  );
}

function ControlBtn({ onClick, icon, active }: { onClick: () => void; icon: React.ReactNode; active?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-8 h-8 flex items-center justify-center transition-colors border ${active ? 'bg-blue-500/20 border-blue-500/50' : 'bg-black/60 border-white/10 hover:bg-white/10'}`}
    >
      {icon}
    </button>
  );
}
