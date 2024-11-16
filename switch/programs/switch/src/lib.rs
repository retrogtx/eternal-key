use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("8hK7vGkWap7CwfWnZG8igqz5uxevUDTbhoeuCcwgvpYq");

#[program]
pub mod dead_man_switch {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, deadline: i64, beneficiary: Pubkey, seed: String) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(deadline > Clock::get()?.unix_timestamp, ErrorCode::InvalidDeadline);
        escrow.owner = ctx.accounts.owner.key();
        escrow.beneficiary = beneficiary;
        escrow.deadline = deadline;
        escrow.last_checkin = Clock::get()?.unix_timestamp;
        escrow.bump = ctx.bumps.escrow;
        escrow.seed = seed;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        Ok(anchor_lang::solana_program::program::invoke(
            &system_instruction::transfer(&ctx.accounts.owner.key(), &ctx.accounts.escrow.key(), amount),
            &[ctx.accounts.owner.to_account_info(), ctx.accounts.escrow.to_account_info(), ctx.accounts.system_program.to_account_info()]
        )?)
    }

    pub fn checkin(ctx: Context<Checkin>, new_deadline: i64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let now = Clock::get()?.unix_timestamp;
        require!(now < escrow.deadline, ErrorCode::DeadlineExceeded);
        require!(new_deadline > now, ErrorCode::InvalidDeadline);
        escrow.deadline = new_deadline;
        escrow.last_checkin = now;
        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        require!(Clock::get()?.unix_timestamp >= ctx.accounts.escrow.deadline, ErrorCode::DeadlineNotReached);
        let balance = ctx.accounts.escrow.to_account_info().lamports();
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? = 0;
        **ctx.accounts.beneficiary.try_borrow_mut_lamports()? += balance;
        Ok(())
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        let balance = ctx.accounts.escrow.to_account_info().lamports();
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? = 0;
        **ctx.accounts.owner.try_borrow_mut_lamports()? += balance;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(deadline: i64, beneficiary: Pubkey, seed: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(init, payer = owner, space = 93 + seed.len(), seeds = [b"escrow", owner.key().as_ref(), seed.as_bytes()], bump)]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, seeds = [b"escrow", owner.key().as_ref(), escrow.seed.as_bytes()], bump = escrow.bump, constraint = escrow.owner == owner.key())]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Checkin<'info> {
    #[account(mut, constraint = escrow.owner == owner.key())]
    pub owner: Signer<'info>,
    #[account(mut, seeds = [b"escrow", owner.key().as_ref(), escrow.seed.as_bytes()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    /// CHECK: This account is safe because we check its key against the stored beneficiary
    #[account(mut, constraint = escrow.beneficiary == beneficiary.key())]
    pub beneficiary: AccountInfo<'info>,
    #[account(mut, seeds = [b"escrow", escrow.owner.as_ref(), escrow.seed.as_bytes()], bump = escrow.bump, close = beneficiary)]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut, constraint = escrow.owner == owner.key())]
    pub owner: Signer<'info>,
    #[account(mut, seeds = [b"escrow", owner.key().as_ref(), escrow.seed.as_bytes()], bump = escrow.bump, close = owner)]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Escrow {
    pub owner: Pubkey,
    pub beneficiary: Pubkey,
    pub deadline: i64,
    pub last_checkin: i64,
    pub bump: u8,
    pub seed: String,
}

#[error_code]
pub enum ErrorCode {
    InvalidDeadline,
    InvalidAmount,
    DeadlineExceeded,
    DeadlineNotReached,
}
