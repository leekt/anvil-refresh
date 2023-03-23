import { EVMTracer } from "./EVMTracer"
import { AnvilRPC } from "./anvil"
const anvilUrl = "http://127.0.0.1:8545";
const defaultRPC = "https://eth-mainnet.g.alchemy.com/v2/90dtUWHmLmwbYpvIeC53UpAICALKyoIu";

const anvil = new AnvilRPC(defaultRPC, anvilUrl);
const tracer = new EVMTracer(anvil);
tracer.traceCall({
  from : "0xfa19fb4d871af87cc737499bceee041453f2fb6b",
  to: "0x0576a174d229e3cfa37253523e645a78a0c91b57",
  data: "0x1fad948c0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000fa19fb4d871af87cc737499bceee041453f2fb6b000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000003c8d20df231ef49635ca3258c9a63a2262ba41e400000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000115320000000000000000000000000000000000000000000000000000000000030d40000000000000000000000000000000000000000000000000000000000000c088000000000000000000000000000000000000000000000000000000060ff48dc00000000000000000000000000000000000000000000000000000000059682f000000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000034000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000164226fbf04000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000044a9059cbb00000000000000000000000073b9c512718fcb72514c5f6f38c5c1ee296960de000000000000000000000000000000000000000000000000000000174876e8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cf000001586cf1f38b1ccb2565a687d68cd9f48a87131c057d49d92914fcaac9caca25b373e9e5b226317c701030ca4efe8c04a9f459c4b644d3ee7bc0b30317165edb3f1c020000003c000000640000000002005ecaaab9e30c9a56d2d9727a93c9c99367fcdd26cd8c5d2a2bd44c6c47e9db190000003c000000000000003c02002bbdf782851da322639d1979f83dab95e9e118d8b607eab1f216043bc74e39f70000000000000000000000320100a3a9debb6a7a1886c2d2ce1a859c51b84324b8dd0000002800000000000000000000000000000000000000000000000000",
})