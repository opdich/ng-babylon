import { TonemappingOperator, Vector3 } from '@babylonjs/core';

export const config = {
  engine: {
    env: {
      clearHex: '#ffffffff',
      ambientHex: '#ffffff',
      sun: {
        diffuse: '#ffffff',
        dir: new Vector3(1, -5, 0),
        intensity: 1.0,
      },
      skybox: {
        enable: false,
        hex: '#f5c7d8',
        size: 20,
      },
      ground: {
        enable: false,
        hex: '#f5c7d8',
        size: 15,
      },
    },
    center_offset: {
      x: 0,
      y: 0,
      z: 0,
    },
  },
  camera: {
    ortho: {
      rot_angle: (3 * Math.PI) / 4,
      scale_factor: 200,
      scale_delta: 0.9,
      scale_upper_limit: 20,
      scal_lower_limit: 550,
      pan_max_x: 75,
      pan_min_x: -75,
      pan_max_z: 75,
      pan_min_z: -75,
    },
    settings: {
      exposure: 0.6,
    },
  },
};
