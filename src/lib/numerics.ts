type Int16 = Int16Array[0];
type Int32 = Int32Array[0];

// for short, int, long naming convention https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html
export function toShort(number: Int16): Int16 {
  /*
  // with this implementation, I don't think it does anything
  // as it is returning a number only, not int16
  const int16 = new Int16Array(1);
  int16[0] = number;
  return int16[0];
  */
  return number;
}
export function toInt(number: number): Int32 {
  /*
  // with this implementation, I don't think it does anything
  // as it is returning a number only, not int32
  const int32 = new Int32Array(1);
  int32[0] = number;
  return int32[0];
  */
  return number;
}
export function maxInt16(num1: Int16, num2: Int16) {
  /*
  // with this implementation, I don't think it does anything
  // as it is returning a number only, not int16
  const arr = Int16Array.from([num1, num2]);
  return arr[0] > arr[1] ? arr[0] : arr[1];
  // also converting to int16 just for comparison accumulates
  // overhead if done thousands of times
  */
  return num1 > num2 ? num1 : num2;
}
