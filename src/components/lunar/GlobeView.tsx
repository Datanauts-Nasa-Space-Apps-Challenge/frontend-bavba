'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LunarFeature, MapLayersConfig, EvaluationPoint } from '@/types/lunar';
import { cartesianToGeodetic, geodeticToCartesian } from '@/lib/lunar-engine';
import { RotateCcw, ZoomIn, ZoomOut, Sun, Orbit } from 'lucide-react';
import { useGlobeTexture } from '@/hooks/use-globe-texture';
import { calculateLunarEphemeris, CelestialPositions } from '@/lib/lunar-ephemeris';
import SimulationControls from './SimulationControls';
import { getLGRSGridLines, getLGRSCellsInBounds } from '@/lib/lgrs';
import { POLAR_LATITUDE_THRESHOLD } from '@/lib/moon-projections';

interface GlobeViewProps {
  features: LunarFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (id: string | null) => void;
  layers: MapLayersConfig;
  evaluationPoints: EvaluationPoint[];
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
  evaluationPoints,
  onInspectPoint,
  simTime,
  onSimTimeChange,
  simSpeed,
  onSimSpeedChange,
  isSimActive,
  onToggleSim,
  isMini = false,
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
  const featuresGroupRef = useRef<THREE.Group | null>(null);
  const evalGroupRef = useRef<THREE.Group | null>(null);

  const [cameraFocus, setCameraFocus] = useState<{ lat: number; lng: number; distance: number }>({
    lat: 0,
    lng: 0,
    distance: 60,
  });

  const dynamicTexture = useGlobeTexture(layers);
  const globeRadius = 16;

  const ephemeris = useMemo(() => {
    return calculateLunarEphemeris(simTime || Date.now(), 3536); 
  }, [simTime]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50000);
    camera.position.set(0, 0, 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();

    // Background Stars
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
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Sun
    const sunGroup = new THREE.Group();
    const sunGeom = new THREE.SphereGeometry(200, 32, 32);
    const sunTex = textureLoader.load('https://svs.gsfc.nasa.gov/vis/a010000/a014400/a014440/sun_color_2048.jpg');
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
    sunGroup.add(new THREE.Mesh(sunGeom, sunMat));
    scene.add(sunGroup);
    sunGroupRef.current = sunGroup;

    // Earth
    const earthGeo = new THREE.SphereGeometry(58.6, 64, 64);
    const earthTex = textureLoader.load('https://svs.gsfc.nasa.gov/vis/a010000/a014900/a014959/earth_color_2048.jpg');
    const earthMat = new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.5 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthRef.current = earth;
    scene.add(earth);

    // Inspector
    const inspectorMarker = new THREE.Group();
    inspectorMarker.add(
      new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.35, 32),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide })
      )
    );
    scene.add(inspectorMarker);
    inspectorMarkerRef.current = inspectorMarker;
    inspectorMarker.visible = false;

    const lgrsGroup = new THREE.Group();
    scene.add(lgrsGroup);
    lgrsGroupRef.current = lgrsGroup;

    const featuresGroup = new THREE.Group();
    scene.add(featuresGroup);
    featuresGroupRef.current = featuresGroup;

    const evalGroup = new THREE.Group();
    scene.add(evalGroup);
    evalGroupRef.current = evalGroup;

    const material = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, color: 0xffffff });
    const proxySphereGeom = new THREE.SphereGeometry(globeRadius, 32, 32);
    const proxySphere = new THREE.Mesh(proxySphereGeom, new THREE.MeshBasicMaterial({ visible: false }));
    scene.add(proxySphere);
    proxySphereRef.current = proxySphere;

    const globeGeom = new THREE.SphereGeometry(globeRadius, 64, 64);
    const moon = new THREE.Mesh(globeGeom, material);
    moon.receiveShadow = true;
    moonMeshRef.current = moon;
    scene.add(moon);

    const loader = new GLTFLoader();
    loader.load('/models/Moon_NASA_LRO_8k_Topo.glb', (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = material;
          moonMeshRef.current = child;
        }
      });
      scene.remove(moon);
      scene.add(model);
    }, undefined, () => console.warn('Fallback sphere.'));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 20;
    controls.maxDistance = 15000;
    controlsRef.current = controls;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseClick = (event: MouseEvent) => {
      if (!mountRef.current || !proxySphereRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      
      if (featuresGroupRef.current) {
        const featureIntersects = raycaster.intersectObjects(featuresGroupRef.current.children);
        if (featureIntersects.length > 0) {
          const selected = featureIntersects[0].object as any;
          if (selected.userData.featureId) {
            onSelectFeature(selected.userData.featureId);
            return;
          }
        }
      }

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

    let lastFocusUpdate = 0;
    let frameId: number;
    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      const controlsChanged = controls.update();

      if (now - lastFocusUpdate > 250) {
        lastFocusUpdate = now;
        const dist = camera.position.distanceTo(controls.target);
        const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
        const geo = cartesianToGeodetic(dir.x * globeRadius, dir.y * globeRadius, dir.z * globeRadius, globeRadius);
        setCameraFocus((prev) =>
          Math.abs(prev.distance - dist) > 1.5 || Math.abs(prev.lat - geo.lat) > 2 || Math.abs(prev.lng - geo.lng) > 2
            ? { lat: geo.lat, lng: geo.lng, distance: dist }
            : prev
        );
      }

      if (isSimActive || controlsChanged) {
        renderer.render(scene, camera);
      }
    };
    animate(0);

    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener('click', handleMouseClick);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [isSimActive]);

  // Features markers rendering
  useEffect(() => {
    if (!featuresGroupRef.current) return;
    const group = featuresGroupRef.current;
    group.clear();

    features.forEach(f => {
      const pos = geodeticToCartesian(f.latitude, f.longitude, globeRadius * 1.005);
      const markerGeom = new THREE.SphereGeometry(0.12, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ 
        color: f.id === selectedFeatureId ? 0x3b82f6 : 0xd97706,
        transparent: true,
        opacity: 0.8
      });
      const marker = new THREE.Mesh(markerGeom, markerMat);
      marker.position.set(pos.x, pos.y, pos.z);
      marker.userData = { featureId: f.id };
      group.add(marker);
    });
  }, [features, selectedFeatureId]);

  // Evaluation points markers rendering
  useEffect(() => {
    if (!evalGroupRef.current) return;
    const group = evalGroupRef.current;
    group.clear();

    evaluationPoints.forEach(p => {
      const pos = geodeticToCartesian(p.latitude, p.longitude, globeRadius * 1.01);
      const markerGeom = new THREE.SphereGeometry(0.18, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: p.color });
      const marker = new THREE.Mesh(markerGeom, markerMat);
      marker.position.set(pos.x, pos.y, pos.z);
      group.add(marker);

      const ringGeom = new THREE.RingGeometry(0.25, 0.3, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: p.color, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(pos.x, pos.y, pos.z);
      ring.lookAt(0, 0, 0);
      group.add(ring);
    });
  }, [evaluationPoints]);

  useEffect(() => {
    if (!lgrsGroupRef.current) return;
    const group = lgrsGroupRef.current;
    group.clear();
    if (!layers.lgrs?.active) return;

    const gridData = getLGRSGridLines(1, 'EQ');
    const radius = globeRadius * 1.002;

    const getPos = (lat: number, lng: number) => {
      const phi = (lat * Math.PI) / 180;
      const theta = (lng * Math.PI) / 180;
      return new THREE.Vector3(radius * Math.cos(phi) * Math.cos(theta), radius * Math.sin(phi), radius * Math.cos(phi) * Math.sin(theta));
    };

    const ltmPoints: THREE.Vector3[] = [];
    gridData.lat.forEach((latObj) => {
      const lat = latObj.value;
      for (let lng = -180; lng < 180; lng += 5) {
        ltmPoints.push(getPos(lat, lng), getPos(lat, lng + 5));
      }
    });
    gridData.lng.forEach((lngObj) => {
      const lng = lngObj.value;
      for (let lat = -POLAR_LATITUDE_THRESHOLD; lat < POLAR_LATITUDE_THRESHOLD; lat += 4) {
        ltmPoints.push(getPos(lat, lng), getPos(lat + 4, lng));
      }
    });

    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ltmPoints), new THREE.LineBasicMaterial({ color: 0x4dabf7, opacity: layers.lgrs.opacity * 0.75, transparent: true })));
  }, [layers.lgrs]);

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
      sunLightRef.current.position.set(sx * 12000, sy * 12000, sz * 12000);
      sunGroupRef.current.position.set(sx * 15000, sy * 15000, sz * 15000);
      sunGroupRef.current.visible = true;

      const [ex, ey, ez] = ephemeris.earthPosition;
      earthRef.current.position.set(ex, ey, ez);
      earthRef.current.visible = true;
      earthRef.current.lookAt(0, 0, 0);
    } else {
      ambientLightRef.current.intensity = 0.4;
      sunGroupRef.current.visible = false;
      earthRef.current.visible = false;
    }
  }, [isSimActive, ephemeris, simTime]);

  return (
    <div className="w-full h-full relative group bg-black overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-col gap-1 pointer-events-auto">
          <ControlBtn onClick={() => controlsRef.current?.reset()} icon={<RotateCcw className="w-3 h-3" />} />
          <ControlBtn onClick={() => {
            const c = controlsRef.current;
            if (!c) return;
            const cam = c.object as THREE.PerspectiveCamera;
            const target = c.target;
            const offset = new THREE.Vector3().subVectors(cam.position, target).multiplyScalar(0.8);
            cam.position.copy(target).add(offset);
          }} icon={<ZoomIn className="w-3 h-3" />} />
          <ControlBtn onClick={() => {
            const c = controlsRef.current;
            if (!c) return;
            const cam = c.object as THREE.PerspectiveCamera;
            const target = c.target;
            const offset = new THREE.Vector3().subVectors(cam.position, target).multiplyScalar(1.2);
            cam.position.copy(target).add(offset);
          }} icon={<ZoomOut className="w-3 h-3" />} />
          <div className="h-px bg-white/10 my-1" />
          <ControlBtn onClick={onToggleSim} icon={isSimActive ? <Sun className="w-3.5 h-3.5 text-blue-400" /> : <Orbit className="w-3.5 h-3.5" />} active={isSimActive} />
        </div>
      </div>
      <SimulationControls isActive={isSimActive} timestamp={simTime} onTimestampChange={onSimTimeChange} speed={simSpeed} onSpeedChange={onSimSpeedChange} onToggle={onToggleSim} telemetry={ephemeris} />
    </div>
  );
}

function ControlBtn({ onClick, icon, active }: { onClick: () => void; icon: React.ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} className={`w-8 h-8 flex items-center justify-center transition-colors border ${active ? 'bg-blue-500/20 border-blue-500/50' : 'bg-black/60 border-white/10 hover:bg-white/10'}`}>
      {icon}
    </button>
  );
}
