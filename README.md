# ZamaVault - Secure Confidential Voting Platform

A professional decentralized voting platform built with Fully Homomorphic Encryption (FHE) using Zama's FHEVM protocol. ZamaVault ensures complete privacy of votes while maintaining transparency and verifiability with a clean, banking-grade interface.

## 🚀 Live Demo

**Frontend**: [https://zama-vault.vercel.app](https://zama-vault.vercel.app)  
**Contract**: [0x4355e5cf8b33020c389ec746e709C949f986146A](https://sepolia.etherscan.io/address/0x4355e5cf8b33020c389ec746e709C949f986146A)  
**Network**: Sepolia Testnet

## 🌟 Features

- **🔒 Complete Privacy**: Votes are encrypted using FHEVM - individual choices remain private
- **📊 Transparent Results**: Vote counts and poll results are publicly verifiable
- **⏰ Time-based Polls**: Automatic poll expiration with countdown timers
- **🚫 Double Vote Prevention**: Each address can only vote once per poll
- **👨‍💼 Admin Controls**: Poll management with creator and admin permissions
- **💼 Professional UI**: Banking-grade interface with modern design
- **📱 Responsive**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

### Smart Contract
- **Network**: Sepolia Testnet
- **Contract**: `SimpleConfidentialVote.sol` - Voting logic with FHEVM simulation
- **Verification**: Contract verified on Etherscan
- **Admin Features**: Poll deletion, ending, and management controls

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with professional design
- **Wallet**: MetaMask integration with auto network switching
- **Encryption**: FHEVM simulation for vote privacy

## 🛠️ Technology Stack

- **Blockchain**: Ethereum (Sepolia Testnet)
- **Smart Contracts**: Solidity 0.8.27
- **Encryption**: Fully Homomorphic Encryption (FHEVM)
- **Development**: Hardhat with TypeScript
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Wallet Integration**: MetaMask with ethers.js

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/suleymanuren/ZamaVault.git
cd ZamaVault
```

### 2. Install Dependencies
```bash
npm install
cd frontend && npm install
```

### 3. Environment Setup
```bash
# Set up Hardhat environment variables
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY

# Configure frontend environment
cp frontend/.env.example frontend/.env.local
```

### 4. Frontend Environment Variables
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x4355e5cf8b33020c389ec746e709C949f986146A
NEXT_PUBLIC_NETWORK_NAME=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
```

### 5. Run Frontend
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` and connect your MetaMask wallet!

## 🔧 Development Commands

### Smart Contract Commands
```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Sepolia
npx hardhat run scripts/deploy-simple-vote.ts --network sepolia

# Verify contract
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

### Hardhat Tasks
```bash
# Create a poll
npx hardhat confidentialVote:createPoll --title "Your Poll Title" --options "Option1,Option2,Option3" --network sepolia

# List all polls
npx hardhat confidentialVote:listPolls --network sepolia

# Get poll information
npx hardhat confidentialVote:getPollInfo --pollid 0 --network sepolia

# Cast a vote
npx hardhat confidentialVote:vote --pollid 0 --option 1 --network sepolia
```

## 🔐 Security Features

- **FHEVM Encryption**: All votes encrypted using Fully Homomorphic Encryption simulation
- **No Private Keys in Frontend**: Secure wallet integration
- **Input Validation**: Comprehensive validation on all user inputs
- **Network Protection**: Automatic network switching and validation
- **Access Control**: Admin and creator permissions for poll management

## 📱 User Guide

### Creating a Poll
1. Connect your MetaMask wallet
2. Ensure you're on Sepolia network (auto-switching available)
3. Click "Create New Poll"
4. Enter poll title and options (2-10 options)
5. Set duration (1 hour to 1 week)
6. Confirm transaction

### Voting on a Poll
1. Browse active polls (no wallet connection required to view)
2. Click "Vote" on your preferred option
3. Connect wallet if not already connected
4. Confirm the encrypted transaction
5. Your vote is now privately recorded!

### Admin Features
- **Poll Creators**: Can end or delete their own polls
- **Admin**: Can delete any poll or clear all polls
- **Vote Counts**: Real-time display of votes per option

## 🌐 Vercel Deployment

### Environment Variables for Vercel
Set these in your Vercel dashboard:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x4355e5cf8b33020c389ec746e709C949f986146A
NEXT_PUBLIC_NETWORK_NAME=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
```

**⚠️ Security Note**: Only public environment variables (prefixed with `NEXT_PUBLIC_`) are exposed to the frontend. Private keys and sensitive data are never included.

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test
npx hardhat test test/SimpleConfidentialVote.ts

# Test on Sepolia
npx hardhat test --network sepolia
```

## 🏆 Built for Zama Developer Program

This project was created for the **Zama Developer Program** competition, showcasing:

### ✅ FHEVM Integration
- Real homomorphic encryption simulation in frontend
- Privacy-preserving vote counting
- Transparent results without revealing individual votes

### ✅ Professional Design
- Banking-grade UI/UX with modern design principles
- Responsive layout for all devices
- Intuitive user experience

### ✅ Complete dApp
- Full-stack application with smart contracts and frontend
- MetaMask integration with automatic network switching
- Real-time poll management and voting

### ✅ Security Focus
- Privacy-first approach to voting
- Secure environment variable handling
- No sensitive data exposure in frontend

## 🎯 Use Cases

- **DAO Governance**: Private voting for decentralized organizations
- **Community Polls**: Anonymous opinion gathering
- **Corporate Surveys**: Confidential employee feedback
- **Market Research**: Private consumer preference polling
- **Elections**: Transparent yet private voting systems

## 👨‍💻 Developer

**Created by**: [@ume07x](https://x.com/ume07x)  
**Discord**: ume06  
**Wallet**: 0xAc7539F65d98313ea4bAbef870F6Ae29107aD4ce

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://zama-vault.vercel.app](https://zama-vault.vercel.app)
- **Contract**: [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x4355e5cf8b33020c389ec746e709C949f986146A)
- **Zama**: [zama.ai](https://zama.ai)
- **FHEVM Docs**: [docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/suleymanuren/ZamaVault/issues)
- **Documentation**: [FHEVM Documentation](https://docs.zama.ai/fhevm)
- **Community**: [Zama Discord](https://discord.zama.ai)

---

**Built with ❤️ using Zama FHEVM**

*Demonstrating the power of Fully Homomorphic Encryption in decentralized voting applications*