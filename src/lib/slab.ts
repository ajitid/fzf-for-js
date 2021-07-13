export interface Slab {
  i16: Int16Array;
  i32: Int32Array;
}

// from https://github.com/junegunn/fzf/blob/764316a53d0eb60b315f0bbcd513de58ed57a876/src/constants.go#L40
export const SLAB_16_SIZE = 100 * 1024; // 200KB * 32 = 12.8MB
export const SLAB_32_SIZE = 2048; // 8KB * 32 = 256KB

export function makeSlab(size16: number, size32: number): Slab {
  return {
    i16: new Int16Array(size16),
    i32: new Int32Array(size32),
  };
}
