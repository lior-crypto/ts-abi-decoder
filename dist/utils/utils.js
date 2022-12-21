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
