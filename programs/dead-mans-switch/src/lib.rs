use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod dead_mans_switch {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, timer_duration: i64) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        switch.owner = ctx.accounts.owner.key();
        switch.last_activity = Clock::get()?.unix_timestamp;
        switch.timer_duration = timer_duration;
        switch.is_active = true;
        Ok(())
    }

    pub fn reset_timer(ctx: Context<ResetTimer>) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        require!(switch.is_active, ErrorCode::SwitchInactive);
        require!(switch.owner == ctx.accounts.owner.key(), ErrorCode::Unauthorized);

        switch.last_activity = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn trigger_payout(ctx: Context<TriggerPayout>) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        require!(switch.is_active, ErrorCode::SwitchInactive);

        let current_time = Clock::get()?.unix_timestamp;
        let time_since_last_activity = current_time - switch.last_activity;

        require!(time_since_last_activity >= switch.timer_duration, ErrorCode::TimerNotExpired);

        // Implement payout logic here
        // For simplicity, we'll just mark the switch as inactive
        switch.is_active = false;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 8 + 8 + 1)]
    pub switch: Account<'info, DeadMansSwitch>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResetTimer<'info> {
    #[account(mut)]
    pub switch: Account<'info, DeadMansSwitch>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct TriggerPayout<'info> {
    #[account(mut)]
    pub switch: Account<'info, DeadMansSwitch>,
}

#[account]
pub struct DeadMansSwitch {
    pub owner: Pubkey,
    pub last_activity: i64,
    pub timer_duration: i64,
    pub is_active: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The switch is inactive")]
    SwitchInactive,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Timer has not expired yet")]
    TimerNotExpired,
}
