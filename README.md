# Eternal Key 🔑

A decentralized "dead man's switch" for crypto inheritance on Solana, ensuring your digital assets reach your loved ones. Or just use it as a simple time-lock for your solana based asset to surprise someone on their birthday maybe.

## 🌟 The Problem

What if Satoshi Nakamoto wanted to pass on his 1.1 million BTC but disappeared or passed away? In the crypto world, there's no built-in inheritance system. Unlike traditional banking, crypto assets can be permanently lost if the owner passes away without sharing their private keys or recovery phrases. I wished to make something that would allow people to easily set up an inheritance system for their crypto assets, without the need of a centralized service.

## 💡 The Solution

Eternal Key provides an automated, trustless solution for crypto inheritance:

- Set up a "dead man's switch" that activates after a period of inactivity
- Designate beneficiaries who can claim assets after the deadline
- Regular "check-ins" to prove you're still active
- Completely decentralized and non-custodial
- Built on Solana for speed and low costs
- The SOL locked into the escrow can be recovered once the account is closed upon withdrawal from the beneficiary.

## 🚀 Features

- **Activity Monitoring**: Automated tracking of wallet activity
- **Secure Transfers**: Trustless transfer to beneficiaries after inactivity threshold
- **Flexible Check-ins**: Extend your deadline with simple check-in transactions
- **Multi-Asset Support**: Works with SOL and other Solana tokens
- **Non-custodial**: You maintain full control of your assets
- **Low Cost**: Minimal fees for setup and maintenance

## 💻 Smart Contract

The core functionality is implemented in Rust using the Anchor framework:

- `initialize`: Create new dead man's switch
- `deposit`: Add funds to escrow
- `checkin`: Reset/extend the deadline
- `claim`: Beneficiary claims funds after deadline
- `cancel`: Owner cancels switch and reclaims funds

<p align="center">🏆 Backed by a <a href="https://x.com/amritwt/status/1856643242215034939">$3000 grant from Superteam</a></p>
<p align="center">Built with ❤️ for the Solana community</p>
