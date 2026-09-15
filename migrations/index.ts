import * as migration_20260915_055858_initial from './20260915_055858_initial';

export const migrations = [
  {
    up: migration_20260915_055858_initial.up,
    down: migration_20260915_055858_initial.down,
    name: '20260915_055858_initial'
  },
];
