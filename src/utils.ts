import axios from "axios";

export function peek(stack : string[], idx : number) {
    return stack[stack.length - 1 - idx]
}

export function toWord(hex: string) :string {
    if(hex.startsWith('0x')) hex = hex.slice(2);
    return "0x" + hex.padStart(64, '0')
}

export function toHex(word: string) :string {
    if(word.startsWith('0x')) word = word.slice(2);
    return '0x' + word
}

export function toAddress(hex: string) :string {
    if(hex.startsWith('0x')) hex = hex.slice(2);
    return '0x' + hex.padStart(40, '0')
}

export async function queryJsonRpc(url: string, method: string, params: any[]): Promise<any>{
    const res = await axios.post(url, {
        id: 1,
        jsonrpc: "2.0",
        method,
        params,
    });
    return res.data.result;
}
