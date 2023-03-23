import { ethers } from "ethers";
import { utils } from "ethers";
import { queryJsonRpc } from "./utils";

interface JSONRPCOption {
    url : string;
}

export interface TraceCallRequest {
    from?: string;
    to: string;
    gas?: number;
    gasPrice?: number;
    value?: number;
    data?: string;
}

interface TraceCallResponse {
    failed: boolean;
    gas: number;
    returnValue: string;
    structLogs: StructLog[];
}
  
export interface StructLog {
    depth: number;
    gas: number;
    gasCost: number;
    op: string;
    pc: number;
    stack: Array<string>;
    storage?: {[index: string]:any};
    memory?: string[];
}

export class AnvilRPC {
    constructor(readonly rpcUrl: string, readonly anvilUrl: string) {
    }

    async resetAnvil(blockNumber?: number) {
        if(!blockNumber) {
            blockNumber = await queryJsonRpc(this.rpcUrl, "eth_blockNumber", []);
        }
        await queryJsonRpc(this.anvilUrl, "anvil_reset", [{
            forking: {
                jsonRpcUrl: this.anvilUrl,
                blockNumber: blockNumber,
            }
        }]);
        let currentBlockNumber = 0;
        // check if it is completed
        while(currentBlockNumber.toString() === blockNumber!.toString()) {
            currentBlockNumber = await queryJsonRpc(this.anvilUrl, "eth_blockNumber", []);
        }
        console.log("reset done");
    }

    async debugTraceCall(tx: TraceCallRequest) : Promise<StructLog[]> {
        const response: TraceCallResponse = await queryJsonRpc(
            this.anvilUrl,
            "debug_traceCall", [tx,
            "latest",
            {
                "enableMemory" : true,
            }
        ]);
        return response.structLogs; 
    }
}