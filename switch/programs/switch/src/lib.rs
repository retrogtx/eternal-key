use anchor_lang::prelude::*;

declare_id!("8hK7vGkWap7CwfWnZG8igqz5uxevUDTbhoeuCcwgvpYq");

#[program]
pub mod switch {
    use super::*;

    pub fn create_switch(
        ctx: Context<CreateSwitch>,
        deadline: i64,
        beneficiary: Pubkey,
        _seed: String,
    ) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        let owner = &ctx.accounts.owner;
        
        // Store the switch data
        switch.owner = owner.key();
        switch.beneficiary = beneficiary;
        switch.deadline = deadline;
        switch.is_active = true;
        switch.bump = ctx.bumps.switch;  // Get bump directly from bumps

        // Transfer SOL to the switch account
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &owner.key(),
            &switch.to_account_info().key(),
            1_000_000_000 // 1 SOL
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                owner.to_account_info(),
                switch.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }

    pub fn execute_transfer(ctx: Context<ExecuteTransfer>) -> Result<()> {
        let switch = &ctx.accounts.switch;
        let clock = Clock::get()?;
        
        require!(switch.is_active, SwitchError::SwitchInactive);
        require!(clock.unix_timestamp >= switch.deadline, SwitchError::DeadlineNotReached);

        msg!("Starting transfer...");
        msg!("Current time: {}", clock.unix_timestamp);
        msg!("Deadline: {}", switch.deadline);

        // Get ALL funds from switch account
        let all_funds = ctx.accounts.switch.to_account_info().lamports();
        msg!("Transferring {} lamports", all_funds);

        // Transfer ALL funds to beneficiary
        **ctx.accounts.switch.to_account_info().try_borrow_mut_lamports()? = 0;
        **ctx.accounts.beneficiary.try_borrow_mut_lamports()? += all_funds;

        msg!("Transfer complete!");
        Ok(())
    }

    pub fn check_in(ctx: Context<CheckIn>, new_deadline: i64) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        require!(switch.owner == ctx.accounts.owner.key(), SwitchError::Unauthorized);
        require!(switch.is_active, SwitchError::SwitchInactive);
        
        let clock = Clock::get()?;
        require!(clock.unix_timestamp < switch.deadline, SwitchError::DeadlineReached);
        
        switch.deadline = new_deadline;
        Ok(())
    }

    pub fn cancel_switch(ctx: Context<CancelSwitch>) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        require!(switch.owner == ctx.accounts.owner.key(), SwitchError::Unauthorized);
        require!(switch.is_active, SwitchError::SwitchInactive);
        
        switch.is_active = false;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(deadline: i64, beneficiary: Pubkey, seed: String)]
pub struct CreateSwitch<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 8 + 1 + 1 + 4 + seed.len(),
        seeds = [b"switch", owner.key().as_ref(), seed.as_bytes()],
        bump
    )]
    pub switch: Account<'info, DeadManSwitch>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckIn<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        constraint = switch.owner == owner.key()
    )]
    pub switch: Account<'info, DeadManSwitch>,
}

#[derive(Accounts)]
pub struct ExecuteTransfer<'info> {
    #[account(
        mut,
        seeds = [b"switch", owner.key().as_ref(), switch.seed.as_bytes()],
        bump = switch.bump,
        constraint = switch.is_active,
        constraint = switch.beneficiary == beneficiary.key(),
        close = beneficiary
    )]
    pub switch: Account<'info, DeadManSwitch>,

    /// CHECK: Owner for PDA
    pub owner: AccountInfo<'info>,

    /// CHECK: Beneficiary verified in constraint
    #[account(mut)]
    pub beneficiary: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelSwitch<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        constraint = switch.owner == owner.key(),
        close = owner
    )]
    pub switch: Account<'info, DeadManSwitch>,
}

#[account]
pub struct DeadManSwitch {
    pub owner: Pubkey,
    pub beneficiary: Pubkey,
    pub deadline: i64,
    pub is_active: bool,
    pub bump: u8,  // Store bump for PDA
    pub seed: String,  // Store seed for later use
}

#[error_code]
pub enum SwitchError {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("The switch is not active")]
    SwitchInactive,
    #[msg("The deadline has not been reached yet")]
    DeadlineNotReached,
    #[msg("The deadline has already been reached")]
    DeadlineReached,
}
