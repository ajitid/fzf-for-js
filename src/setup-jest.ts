//@ts-ignore
import * as replaceAll from "string.prototype.replaceall";

// from https://github.com/testing-library/dom-testing-library/issues/797#issuecomment-843175877
// replaceAll is defined in Node.js v15
replaceAll.shim();
