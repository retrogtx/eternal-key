use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("8hK7vGkWap7CwfWnZG8igqz5uxevUDTbhoeuCcwgvpYq"); // Your actual program ID

#[program]
pub mod dead_man_switch {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        deadline_timestamp: i64,
        beneficiary: Pubkey,
        seed: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        require!(
            deadline_timestamp > clock.unix_timestamp,
            ErrorCode::InvalidDeadline
        );

        msg!("Current time: {}", clock.unix_timestamp);
        msg!("Setting deadline to: {}", deadline_timestamp);
        msg!("Time until deadline: {} seconds", deadline_timestamp - clock.unix_timestamp);

        escrow.owner = ctx.accounts.owner.key();
        escrow.beneficiary = beneficiary;
        escrow.deadline = deadline_timestamp;
        escrow.last_checkin = clock.unix_timestamp;
        escrow.bump = ctx.bumps.escrow;
        escrow.seed = seed;

        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let transfer_ix = system_instruction::transfer(
            &ctx.accounts.owner.key(),
            &ctx.accounts.escrow.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }

    pub fn checkin(ctx: Context<Checkin>, new_deadline: i64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        require!(
            clock.unix_timestamp < escrow.deadline,
            ErrorCode::DeadlineExceeded
        );

        require!(
            new_deadline > clock.unix_timestamp,
            ErrorCode::InvalidDeadline
        );

        escrow.deadline = new_deadline;
        escrow.last_checkin = clock.unix_timestamp;

        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        let clock = Clock::get()?;

        require!(
            clock.unix_timestamp >= escrow.deadline,
            ErrorCode::DeadlineNotReached
        );

        let escrow_balance = ctx.accounts.escrow.to_account_info().lamports();
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? = 0;
        **ctx.accounts.beneficiary.try_borrow_mut_lamports()? += escrow_balance;

        Ok(())
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        let escrow_balance = ctx.accounts.escrow.to_account_info().lamports();
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? = 0;
        **ctx.accounts.owner.try_borrow_mut_lamports()? += escrow_balance;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(deadline_timestamp: i64, beneficiary: Pubkey, seed: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 8 + 8 + 1 + 4 + seed.len(),
        seeds = [b"escrow", owner.key().as_ref(), seed.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", owner.key().as_ref(), escrow.seed.as_bytes()],
        bump = escrow.bump,
        constraint = escrow.owner == owner.key()
    )]
    pub escrow: Account<'info, Escrow>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Checkin<'info> {
    #[account(
        mut,
        constraint = escrow.owner == owner.key()
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", owner.key().as_ref(), escrow.seed.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    /// CHECK: Verified in constraint
    #[account(
        mut,
        constraint = escrow.beneficiary == beneficiary.key()
    )]
    pub beneficiary: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.owner.as_ref(), escrow.seed.as_bytes()],
        bump = escrow.bump,
        close = beneficiary
    )]
    pub escrow: Account<'info, Escrow>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(
        mut,
        constraint = escrow.owner == owner.key()
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", owner.key().as_ref(), escrow.seed.as_bytes()],
        bump = escrow.bump,
        close = owner
    )]
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
    #[msg("Invalid deadline")]
    InvalidDeadline,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Deadline exceeded")]
    DeadlineExceeded,
    #[msg("Deadline not reached")]
    DeadlineNotReached,
}
