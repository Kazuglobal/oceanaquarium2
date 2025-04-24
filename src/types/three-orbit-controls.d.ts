import * as THREE from 'three';

declare module 'three/examples/jsm/controls/OrbitControls' {
  export class OrbitControls {
    constructor(camera: THREE.Camera, domElement: HTMLElement);
    update(): void;
    enabled: boolean;
    dispose(): void;
    // Extend with other methods if needed
  }
}
