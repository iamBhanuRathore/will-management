# Will Management System: Split-Server Trust Architecture (3/4 Threshold)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cryptography](https://img.shields.io/badge/Cryptography-Shamir's%20Secret%20Sharing-blue.svg)](https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing)
[![Blockchain](https://img.shields.io/badge/Blockchain-Smart%20Contract-green.svg)](https://ethereum.org/en/developers/docs/smart-contracts/)

> A decentralized inheritance management system using advanced cryptographic techniques and blockchain technology to secure digital asset transfers while preventing unilateral access.

## Table of Contents

- [Overview](#overview)
- [Core Cryptographic Principles](#1-core-cryptographic-principles)
- [System Architecture](#2-system-architecture)
- [Operational Workflows](#3-operational-workflows)
- [Security Analysis](#4-security-analysis)
- [Advantages](#5-advantages-of-split-server-trust-model)
- [Implementation](#6-technical-implementation-notes)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Will Management System implements a **Split-Server Trust Model** - an innovative approach to secure digital inheritance that prevents unilateral access while maintaining strong cryptographic guarantees. By using a 3-out-of-4 Shamir's Secret Sharing threshold with strategic share distribution, the system ensures no single party can compromise the inheritance while preventing collusion attacks.

## 1. Core Cryptographic Principles

The system's security is built on the **Split-Server Trust Model**, an advanced multi-party approach to secret management that consolidates operational complexity while maintaining strong security guarantees. This architecture uses Shamir's Secret Sharing (SSS) with a 3-out-of-4 threshold, where the platform server holds two shares, creating a powerful but controlled participant.

**Shamir's Secret Sharing Configuration:**

- **The Secret:** The user's seed phrase
- **Total Shares:** 4 shares distributed across 3 parties
- **Threshold:** 3 shares required to reconstruct the original secret
- **Distribution:** User (1 share), Beneficiary (1 share), Platform Server (2 shares)

**Key Security Guarantees:**

- No single party can access the secret unilaterally
- User cannot recover funds without platform participation (preventing unreliable behavior)
- Beneficiary cannot claim assets early without platform validation
- Strong collusion resistance: User + Beneficiary still cannot bypass the system
- Platform cannot access funds without either User or Beneficiary participation

## 2. System Architecture

The architecture maintains the hybrid model separating off-chain cryptographic operations from on-chain state management, now optimized for the 3/4 threshold.

### a. Parties (3 Total)

1. **The User:** Holds 1 share, initiates will creation and can revoke
2. **The Beneficiary:** Holds 1 share, claims inheritance after timelock
3. **The Platform Server:** Holds 2 shares, acts as mandatory auditor and gatekeeper

### b. Client-Side Application (Off-Chain)

Handles all sensitive cryptographic operations using the joint secret creation protocol.

**Key Functionality:**

**Multi-Party Computation (MPC) Setup:**

- **Initiation & Masking:** User's client starts with secret D, generates random values R1 and R2, calculates masked piece P1 = D - R1 - R2
- **Secure Distribution:**
  - User keeps P1
  - Sends R1 to Beneficiary (encrypted with their public key)
  - Sends R2 to Platform Server (encrypted with platform's public key)
- **Independent Share Generation:** Each party runs 3/4 SSS on their piece:
  - User generates 4 shares of P1: (U1, U2, U3, U4)
  - Beneficiary decrypts R1 and generates 4 shares: (B1, B2, B3, B4)
  - Server generates 4 shares of R2: (S1, S2, S3, S4)

**Final Share Distribution:**

- **User's Final Share:** U1 + B1 + S1
- **Beneficiary's Final Share:** U2 + B2 + S2 (encrypted and stored)
- **Server's Final Share #1:** U3 + B3 + S3
- **Server's Final Share #2:** U4 + B4 + S4

**Secret Reconstruction:** Requires 3 of the 4 final shares, ensuring controlled access patterns.

**Security Principle:** The original seed phrase never exists in full on any single system during creation or reconstruction.

### c. Smart Contract (On-Chain)

Lightweight, immutable contract serving as decentralized state manager and timelock arbiter.

**Key Functionality:**

- **Will Registration:** Stores userAddress, beneficiaryAddress, timeLock, isRevoked, isClaimed
- **Revocation Logic:** User can set isRevoked to true anytime before claiming
- **Claiming Validation:** Verifies beneficiary identity, timelock expiration, and will status
- **State Management:** Public, immutable record of will lifecycle events

**Security Principle:** Contract only handles public state and logic - never stores sensitive cryptographic material.

### d. Platform Server Role

Enhanced role as the "split-trust" participant with dual shares.

**Responsibilities:**

- Store 2 encrypted shares securely
- Validate requests against smart contract state
- Provide audit trail for all reconstruction requests
- Act as mandatory gatekeeper preventing unilateral actions
- Facilitate legitimate recovery and claiming operations

## 3. Operational Workflows

### A. Setup (MPC Will Creation)

1. User initiates will creation through client application
2. Joint secret sharing protocol executed (as detailed in section 2b)
3. Final shares distributed: User (1), Beneficiary (1), Server (2)
4. User calls `createWill` function on smart contract with beneficiary address and timelock
5. System ready - no party holds complete secret

### B. During Lifespan

- User can call `revokeWill` anytime before timelock expires
- All parties maintain their encrypted shares
- Smart contract enforces timelock and revocation logic

### C. User Recovery (Controlled Access)

1. User initiates recovery request through client application
2. User provides their 1 share to the system
3. Platform server validates request and provides their 2 shares
4. Client reconstructs seed phrase using 3 total shares
5. Platform logs recovery event for audit purposes

**Result:** User cannot act unilaterally - platform participation ensures accountability.

### D. Beneficiary Claiming

1. Beneficiary verifies timelock expiration and will status on blockchain
2. Beneficiary provides their 1 share
3. Platform server validates claim against smart contract state
4. If valid, platform provides their 2 shares
5. Beneficiary's client reconstructs seed phrase using 3 total shares
6. Beneficiary calls `claimWill` function to update blockchain state

**Result:** Claiming process is gated by both cryptographic and smart contract validation.

## 4. Security Analysis

### Access Control Matrix

| Scenario                       | User Share | Beneficiary Share | Server Shares | Result                     |
| ------------------------------ | ---------- | ----------------- | ------------- | -------------------------- |
| User Solo Recovery             | ✓          | ✗                 | ✗             | **FAIL** - Only 1/3 shares |
| Beneficiary Early Claim        | ✗          | ✓                 | ✗             | **FAIL** - Only 1/3 shares |
| User + Beneficiary Collusion   | ✓          | ✓                 | ✗             | **FAIL** - Only 2/3 shares |
| User Recovery (Legitimate)     | ✓          | ✗                 | ✓✓            | **SUCCESS** - 3/3 shares   |
| Beneficiary Claim (Legitimate) | ✗          | ✓                 | ✓✓            | **SUCCESS** - 3/3 shares   |
| Server Solo Attack             | ✗          | ✗                 | ✓✓            | **FAIL** - Only 2/3 shares |

### Key Security Properties

1. **Unilateral Prevention:** No single party can access the secret alone
2. **Collusion Resistance:** User and Beneficiary together cannot bypass platform controls
3. **Server Accountability:** All legitimate operations require server participation, creating audit trail
4. **Trustless Setup:** MPC creation ensures no party ever holds the complete secret
5. **Time-based Security:** Smart contract enforces inheritance timing rules

## 5. Advantages of Split-Server Trust Model

**Operational Benefits:**

- Reduced infrastructure complexity (3 parties instead of 4)
- Single platform relationship for users
- Simplified key management and recovery processes

**Security Benefits:**

- Strong prevention of unilateral user actions
- Mandatory audit trail for all secret reconstructions
- Resistance to two-party collusion attacks
- Platform cannot access secrets independently

**User Experience Benefits:**

- Clear, predictable recovery process
- Platform-mediated support for legitimate access
- Transparent inheritance claiming mechanism

## 6. Technical Implementation Notes

**Cryptographic Libraries:** Use established SSS implementations (e.g., Shamir's Secret Sharing libraries in relevant programming languages)

**Encryption Standards:** AES-256 for share encryption, RSA-2048 or ECDSA for key exchange

**Secure Channels:** TLS 1.3 for all network communications during setup and operations

**Storage Security:** Hardware Security Modules (HSMs) recommended for platform server share storage

**Smart Contract Platform:** Ethereum, Polygon, or other EVM-compatible chains for broad compatibility

## Contributing

We welcome contributions to improve the Will Management System architecture! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit your changes (`git commit -am 'Add improvement'`)
4. Push to the branch (`git push origin feature/improvement`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**⚠️ Security Notice**: This architecture document is for educational and planning purposes. Implement proper security audits and testing before deploying to production environments.
