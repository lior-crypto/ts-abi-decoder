"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notindexedParser = exports.tupleHandler = exports.inputToString = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const inputToString = (input) => {
    if (input.type === "tuple" && input.components) {
        return "(" + input.components.map(exports.inputToString).join(",") + ")";
    }
    return input.type;
};
exports.inputToString = inputToString;
const tupleHandler = (ret, input) => {
    if (input.type === "tuple" && input.components) {
        const tupleType = {};
        const tupleValue = {};
        input.components.forEach((comp) => {
            if (comp.type === "tuple" && comp.components) {
                tupleValue[comp.name] = (0, exports.tupleHandler)(true, comp);
            }
            else {
                tupleValue[comp.name] = comp.type;
            }
        });
        if (!ret) {
            tupleType[input.name] = tupleValue;
            return tupleType;
        }
        else {
            return tupleValue;
        }
    }
    else {
        return input.type;
    }
};
exports.tupleHandler = tupleHandler;
const notindexedParser = (param, decodedData, logItem, i) => {
    const decodedP = {
        name: param.name,
        type: param.type,
        value: "",
    };
    if (param.indexed) {
        decodedP.value = decodedData;
    }
    else {
        decodedP.value = decodedData[i];
    }
    if (decodedP.value) {
        if (param.type === "address" && typeof decodedP.value === "string") {
            decodedP.value = decodedP.value.toLowerCase();
            // 42 because len(0x) + 40
            if (decodedP.value.length > 42) {
                const toRemove = decodedP.value.length - 42;
                const temp = decodedP.value.split("");
                temp.splice(2, toRemove);
                decodedP.value = temp.join("");
            }
        }
        if (param.type === "uint256" || param.type === "uint8" || param.type === "int") {
            if (typeof decodedP.value === "string" && decodedP.value.startsWith("0x")) {
                decodedP.value = new bn_js_1.default(decodedP.value.slice(2), 16).toString(10);
            }
            else {
                decodedP.value = new bn_js_1.default(decodedP.value.toString()).toString(10);
            }
        }
        if (param.type === "tuple") {
            decodedP.value = [];
            param.components.forEach((comp, index) => {
                const sdsd = (0, exports.notindexedParser)(comp, decodedData[i], logItem, index);
                decodedP.value.push(sdsd);
            });
        }
        return decodedP;
    }
};
exports.notindexedParser = notindexedParser;
