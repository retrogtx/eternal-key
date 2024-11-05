use anchor_lang::prelude::*;

declare_id!("8hK7vGkWap7CwfWnZG8igqz5uxevUDTbhoeuCcwgvpYq");

#[program]
pub mod switch {
    use super::*;

    pub fn create_switch(
        ctx: Context<CreateSwitch>,
        deadline: i64,
        beneficiary: Pubkey,
        seed: String,
    ) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;
        
        // Initialize switch data
        switch.owner = ctx.accounts.owner.key();
        switch.beneficiary = beneficiary;
        switch.deadline = deadline;
        switch.is_active = true;
        switch.bump = ctx.bumps.switch;
        switch.escrow_bump = ctx.bumps.escrow;
        switch.seed = seed;
        switch.last_activity = clock.unix_timestamp;

        Ok(())
    }

    pub fn deposit_funds(ctx: Context<DepositFunds>, amount: u64) -> Result<()> {
        require!(amount > 0, SwitchError::InvalidAmount);
        
        // Transfer SOL from owner to escrow account
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.owner.key(),
            &ctx.accounts.escrow.key(),
            amount
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.escrow.to_account_info(),
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

        // Transfer all funds from escrow to beneficiary
        let escrow_balance = ctx.accounts.escrow.lamports();
        **ctx.accounts.escrow.try_borrow_mut_lamports()? = 0;
        **ctx.accounts.beneficiary.try_borrow_mut_lamports()? += escrow_balance;

        Ok(())
    }

    pub fn check_in(ctx: Context<CheckIn>, new_deadline: i64) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        let clock = Clock::get()?;
        
        require!(switch.owner == ctx.accounts.owner.key(), SwitchError::Unauthorized);
        require!(switch.is_active, SwitchError::SwitchInactive);
        require!(clock.unix_timestamp < switch.deadline, SwitchError::DeadlineReached);
        
        switch.deadline = new_deadline;
        switch.last_activity = clock.unix_timestamp;
        Ok(())
    }

    pub fn cancel_switch(ctx: Context<CancelSwitch>) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        
        require!(switch.owner == ctx.accounts.owner.key(), SwitchError::Unauthorized);
        require!(switch.is_active, SwitchError::SwitchInactive);
        
        // Return funds from escrow to owner
        let escrow_balance = ctx.accounts.escrow.lamports();
        **ctx.accounts.escrow.try_borrow_mut_lamports()? = 0;
        **ctx.accounts.owner.try_borrow_mut_lamports()? += escrow_balance;
        
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
        space = 8 + 32 + 32 + 8 + 1 + 1 + 1 + 4 + seed.len() + 8,
        seeds = [b"switch", owner.key().as_ref(), seed.as_bytes()],
        bump
    )]
    pub switch: Account<'info, DeadManSwitch>,

    /// CHECK: PDA for escrow account
    #[account(
        mut,
        seeds = [b"escrow", switch.key().as_ref()],
        bump
    )]
    pub escrow: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositFunds<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        constraint = switch.owner == owner.key(),
        constraint = switch.is_active
    )]
    pub switch: Account<'info, DeadManSwitch>,

    /// CHECK: PDA for escrow
    #[account(
        mut,
        seeds = [b"escrow", switch.key().as_ref()],
        bump = switch.escrow_bump
    )]
    pub escrow: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteTransfer<'info> {
    #[account(
        mut,
        seeds = [b"switch", owner.key().as_ref(), switch.seed.as_bytes()],
        bump = switch.bump,
        constraint = switch.is_active,
        constraint = switch.beneficiary == beneficiary.key(),
        close = owner
    )]
    pub switch: Account<'info, DeadManSwitch>,

    /// CHECK: Owner for PDA
    pub owner: AccountInfo<'info>,

    /// CHECK: PDA for escrow
    #[account(
        mut,
        seeds = [b"escrow", switch.key().as_ref()],
        bump = switch.escrow_bump
    )]
    pub escrow: AccountInfo<'info>,

    /// CHECK: Beneficiary verified in constraint
    #[account(mut)]
    pub beneficiary: AccountInfo<'info>,

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
pub struct CancelSwitch<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        constraint = switch.owner == owner.key(),
        close = owner
    )]
    pub switch: Account<'info, DeadManSwitch>,

    /// CHECK: PDA for escrow
    #[account(
        mut,
        seeds = [b"escrow", switch.key().as_ref()],
        bump = switch.escrow_bump
    )]
    pub escrow: AccountInfo<'info>,
}

#[account]
pub struct DeadManSwitch {
    pub owner: Pubkey,
    pub beneficiary: Pubkey,
    pub deadline: i64,
    pub is_active: bool,
    pub bump: u8,
    pub escrow_bump: u8,
    pub seed: String,
    pub last_activity: i64,
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
    #[msg("Invalid deposit amount")]
    InvalidAmount,
}
