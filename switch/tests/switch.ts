import * as anchor from "@project-serum/anchor";
import { Keypair, SystemProgram } from '@solana/web3.js';
import { assert } from 'chai';

describe("switch", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // We'll get the program after building
  const program = anchor.workspace.Switch;
  
  const owner = Keypair.generate();
  const beneficiary = Keypair.generate();
  const escrow = Keypair.generate();
  let switchAccount: Keypair;

  before(async () => {
    // Airdrop SOL to owner
    const signature = await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  });

  it("Initializes the switch", async () => {
    switchAccount = Keypair.generate();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 1); // 1 day from now

    await program.methods
      .initialize(
        beneficiary.publicKey,
        new anchor.BN(deadline.getTime())
      )
      .accounts({
        owner: owner.publicKey,
        switch: switchAccount.publicKey,
        escrow: escrow.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner, switchAccount])
      .rpc();

    const account = await program.account.deadManSwitch.fetch(
      switchAccount.publicKey
    );

    assert.equal(
      account.owner.toString(),
      owner.publicKey.toString(),
      "Owner should match"
    );
    
    assert.equal(
      account.beneficiary.toString(),
      beneficiary.publicKey.toString(),
      "Beneficiary should match"
    );
    
    assert.isTrue(account.isActive, "Switch should be active");
  });

  it("Allows owner to check in", async () => {
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + 2); // 2 days from now

    await program.methods
      .checkIn(new anchor.BN(newDeadline.getTime()))
      .accounts({
        owner: owner.publicKey,
        switch: switchAccount.publicKey,
      })
      .signers([owner])
      .rpc();

    const account = await program.account.deadManSwitch.fetch(
      switchAccount.publicKey
    );
    
    assert.equal(
      account.deadline.toString(),
      new anchor.BN(newDeadline.getTime()).toString(),
      "Deadline should be updated"
    );
  });

  it("Executes transfer after deadline", async () => {
    // Fast forward time by modifying the deadline
    const pastDeadline = new Date();
    pastDeadline.setDate(pastDeadline.getDate() - 1); // 1 day ago

    await program.methods
      .checkIn(new anchor.BN(pastDeadline.getTime()))
      .accounts({
        owner: owner.publicKey,
        switch: switchAccount.publicKey,
      })
      .signers([owner])
      .rpc();

    await program.methods
      .executeTransfer()
      .accounts({
        switch: switchAccount.publicKey,
        escrow: escrow.publicKey,
        beneficiary: beneficiary.publicKey,
      })
      .rpc();

    // Verify the transfer
    const escrowBalance = await provider.connection.getBalance(escrow.publicKey);
    assert.equal(escrowBalance, 0, "Escrow should be empty");
  });
});
