export interface Slab {
  i16: Int16Array;
  i32: Int32Array;
}

function makeSlab(size16: number, size32: number): Slab {
  return {
    i16: new Int16Array(size16),
    i32: new Int32Array(size32),
  };
}
