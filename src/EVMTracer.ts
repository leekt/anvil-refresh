import { StructLog, TraceCallRequest, AnvilRPC } from "./anvil"
import { toAddress, toHex, peek, toWord } from "./utils"

interface DebugCall {
    type: string;
    from?: string;
    to?: string;
    gas?: number;
    gasUsed?: number;
    method?: string;
    data?: string;
    value?: string;
}
interface Log {
    topics: string[];
    data: string;
}

interface Level {
    access : {[index: string]:any};
    contractSize : {[index: string]:number};
    opcodes : {[index: string]:number};
    oog : boolean;
}
interface DebugCallResult {
    calls : DebugCall[];
    numberLevels : Level[];
    keccak : string[];
    logs : Log[];
}
export class EVMTracer {
    calls : DebugCall[] = []
    currentLevel : Level = {
        access: {},
        opcodes: {},
        contractSize: {},
        oog: false
    }
    numberLevels : Level[] = []
    numberCounter = 0
    lastOp = ''
    keccak : string[] = []
    logs : Log[] = []
    addrs : string[] = []

    constructor(readonly anvil: AnvilRPC) {
    }

    async traceCall(tx: TraceCallRequest) : Promise<DebugCallResult> {
        //await this.anvil.resetAnvil();
        const logs = await this.anvil.debugTraceCall(tx);
        return this.processLogs(tx, logs);
    }
  
    // increment the "key" in the list. if the key is not defined yet, then set it to "1"
    countSlot (list: { [key: string]: number | undefined }, key: any) {
        list[key] = (list[key] ?? 0) + 1
    }
  
    result (): DebugCallResult {
        return {
            numberLevels: this.numberLevels,
            keccak: this.keccak,
            logs: this.logs,
            calls: this.calls
        }
    }
  
    processLogs(tx: TraceCallRequest, logs: StructLog[]) : DebugCallResult {
        this.addrs.push(tx.to)
        for (const log of logs) {
            this.processStructLog(log)
        }
        return this.result()
    }
  
    processStructLog(log: StructLog) {
        const opcode = log.op.toString();
        const memory = log.memory?.join('') ?? '';
        if(log.gas < log.gasCost) {
            this.currentLevel.oog = true;
        }
        if (opcode === 'REVERT' || opcode === 'RETURN') {
            // exit() is not called on top-level return/revent, so we reconstruct it
            // from opcode
            const ofs = parseInt(peek(log.stack, 0).toString())
            const len = parseInt(peek(log.stack, 1).toString())
            const data = toHex(memory.slice(ofs*2, ofs*2 + len*2)).slice(0, 1000)
            // this.debug.push(opcode + ' ' + data)
            this.calls.push({
                type: opcode,
                gasUsed: 0,
                data
            })
            this.addrs.pop()
        }
    
        if (opcode.match(/^(EXT.*|CALL|CALLCODE|DELEGATECALL|STATICCALL)$/) != null) {
            // this.debug.push('op=' + opcode + ' last=' + this.lastOp + ' stacksize=' + log.stack.length())
            const idx = opcode.startsWith('EXT') ? 0 : 1
            const addr = toAddress(peek(log.stack,idx).toString())
            if ((this.currentLevel.contractSize[addr] ?? 0) === 0 /*&& !isPrecompiled(addr)*/) {
            this.currentLevel.contractSize[addr] = 10; //getCode(addr).length
            }
            if (opcode.match(/^(CALL|CALLCODE|DELEGATECALL|STATICCALL)$/) != null) {
            this.calls.push({
                type: opcode,
                from: this.addrs[this.addrs.length - 1],
                to: addr,
                //method: toHex(frame.getInput()).slice(0, 10),
                gas: parseInt(peek(log.stack, 0).toString()),
                value: opcode === 'CALL' || opcode === 'CALLCODE' ? peek(log.stack, 2).toString() : undefined
            })
            if (opcode === 'CALL' || opcode === 'CALLCODE' || opcode === "STATICCALL") {
                this.addrs.push(addr)
            } else {
                this.addrs.push(this.addrs[this.addrs.length - 1])
            }
            }
        }
    
        if (log.depth === 1) {
            // NUMBER opcode at top level split levels
            if (opcode === 'NUMBER') this.numberCounter++
            if (this.numberLevels[this.numberCounter] == null) {
                this.currentLevel = this.numberLevels[this.numberCounter] = {
                    access: {},
                    opcodes: {},
                    contractSize: {},
                    oog: false
                }
            }
            this.lastOp = ''
            return
        }
    
        if (this.lastOp === 'GAS' && !opcode.includes('CALL')) {
            // count "GAS" opcode only if not followed by "CALL"
            this.countSlot(this.currentLevel.opcodes, 'GAS')
        }
        if (opcode !== 'GAS') {
            // ignore "unimportant" opcodes:
            if (opcode.match(/^(DUP\d+|PUSH\d+|SWAP\d+|POP|ADD|SUB|MUL|DIV|EQ|LTE?|S?GTE?|SLT|SH[LR]|AND|OR|NOT|ISZERO)$/) == null) {
                this.countSlot(this.currentLevel.opcodes, opcode)
            }
        }
        this.lastOp = opcode
    
        if (opcode === 'SLOAD' || opcode === 'SSTORE') {
            const slot = toWord(peek(log.stack,0).toString())
            const addr = this.addrs[this.addrs.length - 1]
    
            let access = this.currentLevel.access[addr] as any
            if (access == null) {
                access = {
                    reads: {},
                    writes: {}
                }
                this.currentLevel.access[addr] = access;
            }
            if (opcode === 'SLOAD') {
            // read slot values before this UserOp was created
            // (so saving it if it was written before the first read)
            // console.log("addr : " , addr)
            // console.log(access.reads);
            if (access.reads[slot] == null && access.writes[slot] == null) {
                // console.log("storage : ", opcode)
                // console.log("debug op : " , log)
                // console.log(log.storage);
                if(log.storage != undefined) {
                    // TODO there is weird thing going on in here i think if there aren't any state diff, it does not give storage
                    access.reads[slot] = log.storage![slot];
                }
            }
            } else {
                this.countSlot(access.writes, slot)
            }
        }
    
        if (opcode === 'KECCAK256') {
            // collect keccak on 64-byte blocks
            const ofs = parseInt(peek(log.stack,0).toString())
            const len = parseInt(peek(log.stack,1).toString())
            // currently, solidity uses only 2-word (6-byte) for a key. this might change..
            // still, no need to return too much
            if (len > 20 && len < 512) {
                // if (len === 64) {
                this.keccak.push(toHex(memory.slice(ofs*2, ofs*2 + len*2)))
            }
        } else if (opcode.startsWith('LOG')) {
            const count = parseInt(opcode.substring(3))
            const ofs = parseInt(peek(log.stack,0).toString())
            const len = parseInt(peek(log.stack,1).toString())
            const topics : string[] = []
            for (let i = 0; i < count; i++) {
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                topics.push('0x' + peek(log.stack, 2+i).toString())
            }
            const data = toHex(memory.slice(ofs*2, ofs*2 + len*2))
            this.logs.push({
                topics,
                data: data
            })
        }
    }
}