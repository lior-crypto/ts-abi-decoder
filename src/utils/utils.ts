import BN from "bn.js";
import { AbiInput } from "web3-utils";

import { DecodeEvent, Input, Log } from "../types";

export const inputToString = (input: Input): string => {
  if (input.type === "tuple" && input.components) {
    return "(" + input.components.map(inputToString).join(",") + ")";
  }
  return input.type;
};

export const tupleHandler = (ret: boolean, input: AbiInput) => {
  if (input.type === "tuple" && input.components) {
    const tupleType: Record<string, Record<string, string>> = {};

    const tupleValue: Record<string, string> = {};
    input.components.forEach((comp) => {
      if (comp.type === "tuple" && comp.components) {
        tupleValue[comp.name] = tupleHandler(true, comp) as any;
      } else {
        tupleValue[comp.name] = comp.type;
      }
    });
    if (!ret) {
      tupleType[input.name] = tupleValue;
      return tupleType;
    } else {
      return tupleValue;
    }
  } else {
    return input.type;
  }
};

export const notindexedParser = (param: AbiInput, decodedData: any, logItem: Log, i: number) => {
  const decodedP: DecodeEvent = {
    name: param.name,
    type: param.type,
    value: "",
  };

  if (param.indexed) {
    decodedP.value = decodedData;
  } else {
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
        decodedP.value = new BN(decodedP.value.slice(2), 16).toString(10);
      } else {
        decodedP.value = new BN(decodedP.value.toString()).toString(10);
      }
    }

    if (param.type === "tuple") {
      decodedP.value = [];
      param.components.forEach((comp, index) => {
        const sdsd = notindexedParser(comp, decodedData[i], logItem, index);
        (decodedP.value as any).push(sdsd);
      });
    }
    return decodedP;
  }
};
