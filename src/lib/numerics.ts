export type Int16 = Int16Array[0];
export type Int32 = Int32Array[0];

// TODO extract these numeric operations out
// short, int, long https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html
export function toShort(number: number): Int16 {
  // with this implementation, I don't think it does anything
  // as it is returning a number only, not int16
  const int16 = new Int16Array(1);
  int16[0] = number;
  return int16[0];
}
export function toInt(number: number): Int32 {
  // with this implementation, I don't think it does anything
  // as it is returning a number only, not int32
  const int32 = new Int32Array(1);
  int32[0] = number;
  return int32[0];
}
export function maxInt16(num1: number, num2: number) {
  // with this implementation, I don't think it does anything
  // as it is returning a number only, not int16
  const arr = Int16Array.from([num1, num2]);
  return arr[0] > arr[1] ? arr[0] : arr[1];
}
