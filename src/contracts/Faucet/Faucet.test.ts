import { bytesToHex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { PublicClient } from "../../clients/index.js";
import { LocalECDSAKeySigner } from "../../signers/index.js";
import { MockTransport } from "../../transport/MockTransport.js";
import { WalletV1 } from "../WalletV1/WalletV1.js";
import { Faucet } from "./Faucet.js";

const signer = new LocalECDSAKeySigner({
  privateKey: generatePrivateKey(),
});

test("Faucet with retry", async () => {
  const fn = vi.fn().mockRejectedValue(new Error("Not enough funds"));
  const client = new PublicClient({
    transport: new MockTransport(fn),
    shardId: 1,
  });
  const faucet = new Faucet(client);
  const pubkey = await signer.getPublicKey();
  const address = bytesToHex(
    WalletV1.calculateWalletAddress({
      pubKey: pubkey,
      shardId: 1,
      salt: 100n,
    }),
  );

  await expect(
    async () => await faucet.withdrawToWithRetry(address, 100000n, 5),
  ).rejects.toThrowError();

  expect(fn.mock.calls.length).toBeGreaterThanOrEqual(5);
});
