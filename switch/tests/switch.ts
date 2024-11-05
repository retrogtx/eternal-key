import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
import { assert } from "chai";

describe("dead-man-switch", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DeadManSwitch;
  const owner = Keypair.generate();
  const beneficiary = Keypair.generate();

  before(async () => {
    // Airdrop 2 SOL to owner
    const signature = await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  });

  it("Creates an escrow with 15-second deadline", async () => {
    // Get current time
    const slot = await provider.connection.getSlot();
    const timestamp = await provider.connection.getBlockTime(slot);
    if (!timestamp) throw new Error("Couldn't get block time");

    // Set deadline 15 seconds from now
    const deadline = timestamp + 15;

    // Generate PDA for escrow
    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), owner.publicKey.toBuffer()],
      program.programId
    );

    // Initialize escrow
    await program.methods
      .initialize(
        new anchor.BN(deadline),
        beneficiary.publicKey
      )
      .accounts({
        owner: owner.publicKey,
        escrow: escrowPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    // Verify escrow state
    const escrow = await program.account.escrow.fetch(escrowPDA);
    assert.equal(
      escrow.beneficiary.toBase58(),
      beneficiary.publicKey.toBase58(),
      "Beneficiary should match"
    );
    assert.equal(
      escrow.deadline.toString(),
      new anchor.BN(deadline).toString(),
      "Deadline should match"
    );
  });

  it("Allows claim after 15 seconds", async () => {
    // Wait for 16 seconds
    await new Promise(resolve => setTimeout(resolve, 16000));

    // Get PDA for escrow
    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), owner.publicKey.toBuffer()],
      program.programId
    );

    // Record beneficiary's balance before claim
    const balanceBefore = await provider.connection.getBalance(beneficiary.publicKey);

    // Claim funds
    await program.methods
      .claim()
      .accounts({
        beneficiary: beneficiary.publicKey,
        escrow: escrowPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([beneficiary])
      .rpc();

    // Verify beneficiary received funds
    const balanceAfter = await provider.connection.getBalance(beneficiary.publicKey);
    assert(balanceAfter > balanceBefore, "Beneficiary balance should increase");
  });
});
