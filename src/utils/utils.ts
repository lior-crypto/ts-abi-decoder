import { Input } from "@types";

export const inputToString = (input: Input): string => {
  if (input.type === "tuple" && input.components) {
    return "(" + input.components.map(inputToString).join(",") + ")";
  }
  return input.type;
};

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
