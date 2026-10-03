type Bezier = readonly [number, number, number, number];

export const motionTokens = {
  duration: {
    quick: 160,
    base: 240,
    settle: 320,
    arrange: 420,
    drape: 640,
    sheen: 1100,
  },
  timer: {
    wait: 300,
    dwell: 700,
    step: 60,
    linger: 1500,
    announce: 2000,
    loop: 5000,
  },
  easing: {
    silk: [0.22, 0.61, 0.36, 1],
    fall: [0.16, 1, 0.3, 1],
    carry: [0.5, 0, 0.2, 1],
    release: [0.32, 0, 0.67, 0],
  } satisfies Record<string, Bezier>,
} as const;
