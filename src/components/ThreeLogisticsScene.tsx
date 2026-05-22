import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { DeliveryPoint, OrderStatus } from '../types';

interface Props {
  route: DeliveryPoint[];
  progress: number;
  status: OrderStatus;
  gpsOnline: boolean;
  issue: string | null;
}

interface PathPoint {
  x: number;
  y: number;
}

export function ThreeLogisticsScene({ route, progress, status, gpsOnline, issue }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const truckRef = useRef<THREE.Group | null>(null);
  const pulseRef = useRef<THREE.Mesh | null>(null);
  const lineRef = useRef<THREE.Line | null>(null);
  const completedLineRef = useRef<THREE.Line | null>(null);
  const pathRef = useRef<PathPoint[]>([]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040404);

    const camera = new THREE.PerspectiveCamera(44, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 8.8, 10.7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.55);
    key.position.set(4, 9, 5);
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12.4, 12.4),
      new THREE.MeshStandardMaterial({ color: 0x070707, metalness: 0.12, roughness: 0.72 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.05;
    scene.add(floor);

    const grid = new THREE.GridHelper(12, 24, 0x515151, 0x141414);
    grid.position.y = -0.03;
    scene.add(grid);

    for (let i = 0; i < 26; i += 1) {
      const size = 0.22 + ((i * 17) % 9) / 18;
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(size, 0.25 + ((i * 11) % 13) / 12, size),
        new THREE.MeshStandardMaterial({ color: i % 3 ? 0x101010 : 0x181818, metalness: 0.38, roughness: 0.42 }),
      );
      const x = -5.2 + ((i * 2.17) % 10.4);
      const z = -5.1 + ((i * 3.41) % 10.2);
      if (Math.abs(x) > 0.9 || Math.abs(z) > 0.9) {
        building.position.set(x, building.geometry.parameters.height / 2 - 0.04, z);
        scene.add(building);
      }
    }

    const warehouse = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.46, 1.25),
      new THREE.MeshStandardMaterial({ color: 0xebebeb, metalness: 0.1, roughness: 0.28 }),
    );
    base.position.y = 0.23;
    warehouse.add(base);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.0, 0.48, 4),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.35, roughness: 0.3 }),
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.73;
    warehouse.add(roof);
    scene.add(warehouse);

    const fullPath: PathPoint[] = [{ x: 0, y: 0 }, ...route.map((point) => ({ x: point.x, y: point.y }))];
    pathRef.current = fullPath;
    const points3 = fullPath.map((point) => new THREE.Vector3(point.x, 0.07, point.y));

    const routeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points3),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 }),
    );
    lineRef.current = routeLine;
    scene.add(routeLine);

    const completedLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([points3[0], points3[0]]),
      new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.95 }),
    );
    completedLineRef.current = completedLine;
    scene.add(completedLine);

    route.forEach((point, index) => {
      const marker = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.012, 8, 56),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.78 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.06;
      marker.add(ring);

      const pin = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.5, 24),
        new THREE.MeshStandardMaterial({ color: index % 2 ? 0xffffff : 0x161616, metalness: 0.35, roughness: 0.28 }),
      );
      pin.position.y = 0.36;
      marker.add(pin);
      marker.position.set(point.x, 0, point.y);
      scene.add(marker);
    });

    const truck = new THREE.Group();
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.36, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.08, roughness: 0.22 }),
    );
    cabin.position.set(0.36, 0.27, 0);
    truck.add(cabin);

    const cargo = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.4, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.5, roughness: 0.26 }),
    );
    cargo.position.set(-0.24, 0.29, 0);
    truck.add(cargo);

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cargo.geometry), new THREE.LineBasicMaterial({ color: 0xffffff }));
    edges.position.copy(cargo.position);
    truck.add(edges);

    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x040404, metalness: 0.25, roughness: 0.38 });
    [[-0.47, -0.28], [-0.09, -0.28], [0.34, -0.28], [-0.47, 0.28], [-0.09, 0.28], [0.34, 0.28]].forEach(([x, z]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 24), wheelMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.1, z);
      truck.add(wheel);
    });
    truckRef.current = truck;
    scene.add(truck);

    const pulse = new THREE.Mesh(
      new THREE.TorusGeometry(0.43, 0.018, 8, 82),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }),
    );
    pulse.rotation.x = Math.PI / 2;
    pulseRef.current = pulse;
    scene.add(pulse);

    const clock = new THREE.Clock();
    let frameId = 0;

    function animate() {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      warehouse.rotation.y = Math.sin(time * 0.35) * 0.04;

      if (pulseRef.current) {
        pulseRef.current.scale.setScalar(1 + (Math.sin(time * 2.7) + 1) * 0.08);
        (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = gpsOnline ? 0.23 + (Math.sin(time * 3.3) + 1) * 0.15 : 0.05;
      }

      if (lineRef.current) {
        (lineRef.current.material as THREE.LineBasicMaterial).opacity = status === 'DELIVERED' ? 0.38 : issue ? 0.55 : 0.92;
      }

      renderer.render(scene, camera);
    }
    animate();

    function resize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose?.());
        else material?.dispose?.();
      });
    };
  }, [route, status, gpsOnline, issue]);

  useEffect(() => {
    const truck = truckRef.current;
    const pulse = pulseRef.current;
    const path = pathRef.current;
    if (!truck || !path.length) return;

    const max = path.length - 1;
    const scaled = progress * max;
    const index = Math.min(Math.floor(scaled), max - 1);
    const local = scaled - index;
    const a = path[index];
    const b = path[index + 1] || path[index];
    const x = a.x + (b.x - a.x) * local;
    const y = a.y + (b.y - a.y) * local;

    truck.position.set(x, 0, y);
    pulse?.position.set(x, 0.1, y);
    truck.rotation.y = -Math.atan2(b.y - a.y, b.x - a.x);

    const completedLine = completedLineRef.current;
    if (completedLine) {
      const completedPoints = path.slice(0, index + 1).map((point) => new THREE.Vector3(point.x, 0.07, point.y));
      completedPoints.push(new THREE.Vector3(x, 0.07, y));
      completedLine.geometry.dispose();
      completedLine.geometry = new THREE.BufferGeometry().setFromPoints(completedPoints);
    }
  }, [progress]);

  return <div ref={mountRef} className="h-[460px] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl" />;
}
