import { AbiItem } from "web3-utils";

export interface ABIs {
  ABIs: AbiItem[];
  Ids: Record<string, AbiItem>;
  topics: Record<string, string>;
}
export interface DecodeData {
  name: string;
  params: {
    name: string;
    value: {
      [key: string]: any;
    };
    type: string;
  }[];
}
export interface Input {
  name: string;
  type: string;
  indexed?: boolean;
  components?: Input[];
  internalType?: string;
}
export interface DecodeLog {
  name: string;
  events: DecodeEvent[];
  address: string;
}

export interface DecodeEvent {
  [x: string]: any;
  name: string;
  type: string;
  value: string | DecodeEvent[];
}

export interface Log {
  address: string;
  data: string;
  topics: string[];
}
