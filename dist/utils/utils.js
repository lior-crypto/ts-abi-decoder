"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputToString = void 0;
const inputToString = (input) => {
    if (input.type === "tuple" && input.components) {
        return "(" + input.components.map(exports.inputToString).join(",") + ")";
    }
    return input.type;
};
exports.inputToString = inputToString;
// const inputToString = (newobj: any, a: DecodeEvent) => {
//   if (Array.isArray(a.value) && typeof a.value !== 'string') {
//     newobj[a.name] = {}
//     a.value.forEach((b) => {
//       inputToString(newobj[a.name], b)
//     })
//   } else {
//     newobj[a.name] = a.value
//   }
// }
// const inputToString = (newobj: any, a: DecodeEvent) => {
//   if (Array.isArray(a.value) && typeof a.value !== 'string') {
//     newobj[a.name] = {}
//     a.value.forEach((b) => {
//       inputToString(newobj[a.name], b)
//     })
//   } else {
//     newobj[a.name] = a.value
//   }
// }
