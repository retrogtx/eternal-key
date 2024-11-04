use anchor_lang::prelude::*;

declare_id!("8hK7vGkWap7CwfWnZG8igqz5uxevUDTbhoeuCcwgvpYq");

#[program]
pub mod switch {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        beneficiary: Pubkey,
        deadline: i64,
    ) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        switch.owner = ctx.accounts.owner.key();
        switch.beneficiary = beneficiary;
        switch.deadline = deadline;
        switch.is_active = true;
        Ok(())
    }

    pub fn check_in(ctx: Context<CheckIn>, new_deadline: i64) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        require!(switch.owner == ctx.accounts.owner.key(), SwitchError::Unauthorized);
        require!(switch.is_active, SwitchError::SwitchInactive);
        
        switch.deadline = new_deadline;
        Ok(())
    }

    pub fn verify_deadline(ctx: Context<VerifyDeadline>) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        let clock = Clock::get()?;
        
        require!(switch.is_active, SwitchError::SwitchInactive);
        require!(
            clock.unix_timestamp >= switch.deadline, 
            SwitchError::DeadlineNotReached
        );

        switch.is_active = false;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 8 + 1 // discriminator + owner + beneficiary + deadline + is_active
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
        constraint = switch.owner == owner.key(),
    )]
    pub switch: Account<'info, DeadManSwitch>,
}

#[derive(Accounts)]
pub struct VerifyDeadline<'info> {
    #[account(
        mut,
        constraint = switch.beneficiary == beneficiary.key()
    )]
    pub switch: Account<'info, DeadManSwitch>,

    /// CHECK: Beneficiary is verified against switch account
    pub beneficiary: AccountInfo<'info>,
}

#[account]
pub struct DeadManSwitch {
    pub owner: Pubkey,
    pub beneficiary: Pubkey,
    pub deadline: i64,
    pub is_active: bool,
}

#[error_code]
pub enum SwitchError {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("The switch is not active")]
    SwitchInactive,
    #[msg("The deadline has not been reached yet")]
    DeadlineNotReached,
}
