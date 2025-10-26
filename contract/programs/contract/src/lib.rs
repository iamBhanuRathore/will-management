use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
declare_id!("G949ojk7fbgzHAEysoQUsu2CBy6CKC8wcWSerZFmpaCg");

#[program]
pub mod will_management {
    use super::*;
    /// Instruction to create a new will on-chain.
    /// Stores metadata and encrypted shares. Platform shares (share1, share2) are kept off-chain.
    pub fn create_will(
        ctx: Context<CreateWill>,
        will_name: String,
        will_description: String,
        time_lock: u64,
        encrypted_user_share: Vec<u8>,
        encrypted_beneficiary_share: Vec<u8>,
    ) -> Result<()> {
        require!(will_name.len() <= 100, ErrorCode::StringTooLong); // Limit sizes to prevent oversized accounts
        require!(will_description.len() <= 500, ErrorCode::StringTooLong);
        require!(encrypted_user_share.len() <= 1024, ErrorCode::DataTooLarge);
        require!(
            encrypted_beneficiary_share.len() <= 1024,
            ErrorCode::DataTooLarge
        );

        let will = &mut ctx.accounts.will;
        will.creator = *ctx.accounts.creator.key;
        will.beneficiary = ctx.accounts.beneficiary.key();
        will.time_lock = time_lock;
        will.status = Status::Initialized as u8;
        will.will_name = will_name;
        will.will_description = will_description;
        will.encrypted_user_share = encrypted_user_share;
        will.encrypted_beneficiary_share = encrypted_beneficiary_share;

        Ok(())
    }

    /// Instruction to activate the will (after submitting encrypted shares, if needed).
    pub fn activate_will(ctx: Context<ActivateWill>) -> Result<()> {
        let will = &mut ctx.accounts.will;
        require_eq!(
            will.creator,
            *ctx.accounts.creator.key,
            ErrorCode::Unauthorized
        );
        require_eq!(
            will.status,
            Status::Initialized as u8,
            ErrorCode::InvalidStatus
        );

        will.status = Status::Active as u8;

        Ok(())
    }

    /// Instruction to revoke the will.
    pub fn revoke_will(ctx: Context<RevokeWill>) -> Result<()> {
        let will = &mut ctx.accounts.will;
        require_eq!(
            will.creator,
            *ctx.accounts.creator.key,
            ErrorCode::Unauthorized
        );
        require_eq!(will.status, Status::Active as u8, ErrorCode::InvalidStatus);

        will.status = Status::Revoked as u8;

        Ok(())
    }

    /// Instruction for beneficiary to claim the will, updating status on-chain.
    /// This does not release shares; it only marks the will as claimed if timelock has passed.
    /// Backend checks this status before releasing platform shares.
    pub fn claim_will(ctx: Context<ClaimWill>) -> Result<()> {
        let will = &mut ctx.accounts.will;
        require_eq!(
            will.beneficiary,
            *ctx.accounts.beneficiary.key,
            ErrorCode::Unauthorized
        );
        require_eq!(will.status, Status::Active as u8, ErrorCode::InvalidStatus);

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= will.time_lock as i64,
            ErrorCode::TimelockNotExpired
        );

        will.status = Status::Claimed as u8;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(will_name: String)]
pub struct CreateWill<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 32 + 8 + 1 + 4 + will_name.len() + 4 + 500 + 4 + 1024 + 4 + 1024, // Allocate space dynamically but with max limits
        seeds = [creator.key().as_ref(), will_name.as_bytes()],
        bump
    )]
    pub will: Account<'info, WillAccount>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub beneficiary: AccountInfo<'info>, // Beneficiary pubkey (not signer at creation)
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ActivateWill<'info> {
    #[account(mut)]
    pub will: Account<'info, WillAccount>,
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevokeWill<'info> {
    #[account(mut)]
    pub will: Account<'info, WillAccount>,
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWill<'info> {
    #[account(mut)]
    pub will: Account<'info, WillAccount>,
    pub beneficiary: Signer<'info>,
}

#[account]
#[derive(Default)]
pub struct WillAccount {
    pub creator: Pubkey,
    pub beneficiary: Pubkey,
    pub time_lock: u64,
    pub status: u8,
    pub will_name: String,
    pub will_description: String,
    pub encrypted_user_share: Vec<u8>,
    pub encrypted_beneficiary_share: Vec<u8>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access.")]
    Unauthorized,
    #[msg("Invalid will status.")]
    InvalidStatus,
    #[msg("Timelock has not expired.")]
    TimelockNotExpired,
    #[msg("String too long.")]
    StringTooLong,
    #[msg("Data too large.")]
    DataTooLarge,
}

#[repr(u8)]
pub enum Status {
    Initialized = 0,
    Active = 1,
    Revoked = 2,
    Claimed = 3,
    Expired = 4,
}
