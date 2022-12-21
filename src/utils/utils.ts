import { Input } from "@types";

export const inputToString = (input: Input): string => {
  if (input.type === "tuple" && input.components) {
    return "(" + input.components.map(inputToString).join(",") + ")";
  }
  return input.type;
};
