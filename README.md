# ZamaVault - Secure Confidential Voting Platform

A professional decentralized voting platform built with Fully Homomorphic Encryption (FHE) using Zama's FHEVM protocol. ZamaVault ensures complete privacy of votes while maintaining transparency and verifiability with a clean, banking-grade interface.

## 🌟 Features

- **🔒 Complete Privacy**: Votes are encrypted using FHE - results remain hidden until poll ends
- **🗳️ Multiple Poll Types**: Support for Yes/No, multiple choice, and custom options
- **⏰ Time-based Polls**: Automatic poll expiration with customizable duration
- **🚫 Double Vote Prevention**: Each address can only vote once per poll
- **🔐 FHEVM Integration**: Frontend uses real FHEVM encryption simulation
- **💼 Professional UI**: Banking-grade interface design
- **🌐 Cross-platform**: Responsive design for desktop and mobile

## 🚀 Live Demo

**Frontend**: [Coming Soon - Vercel Deployment]
**Contract**: [0x10eF703ed9520d97A6750864c8fF3c2363132f19](https://sepolia.etherscan.io/address/0x10eF703ed9520d97A6750864c8fF3c2363132f19)

## 🏗️ Architecture

### Smart Contract
- **Network**: Sepolia Testnet
- **Contract**: `ConfidentialVote.sol` - Main voting logic with FHE
- **Verification**: Contract verified on Etherscan

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with professional design
- **Wallet**: MetaMask integration with auto network switching
- **Encryption**: FHEVM simulation for vote privacy

## 🛠️ Technology Stack

- **Blockchain**: Ethereum (Sepolia Testnet)
- **Smart Contracts**: Solidity 0.8.27
- **Encryption**: Fully Homomorphic Encryption (FHE)
- **Development**: Hardhat with FHEVM plugin
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Wallet Integration**: MetaMask with ethers.js

## 📋 Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Package manager
- **MetaMask**: Browser wallet extension
- **Sepolia ETH**: For transaction fees

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/ZamaVault.git
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
NEXT_PUBLIC_CONTRACT_ADDRESS=0x10eF703ed9520d97A6750864c8fF3c2363132f19
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
npx hardhat deploy --network sepolia

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

### Frontend Commands
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔐 Security Features

- **FHE Encryption**: All votes encrypted using Fully Homomorphic Encryption
- **No Private Keys in Frontend**: Secure wallet integration
- **Input Validation**: Comprehensive validation on all user inputs
- **Network Protection**: Automatic network switching and validation
- **Access Control**: Poll creator permissions and voting restrictions

## 📱 User Guide

### Creating a Poll
1. Connect your MetaMask wallet
2. Ensure you're on Sepolia network
3. Click "Create New Poll"
4. Enter poll title and options (2-10 options)
5. Set duration (1 hour to 1 week)
6. Confirm transaction

### Voting on a Poll
1. Browse active polls
2. Click "Vote" on your preferred option
3. Confirm the encrypted transaction
4. Your vote is now privately recorded!

### Viewing Results
- Click the eye icon to toggle result visibility
- Results show "Encrypted" status during active voting
- Final results revealed after poll ends

## 🌐 Deployment

### Vercel Deployment
1. Fork this repository
2. Connect to Vercel
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_NETWORK_NAME`
   - `NEXT_PUBLIC_CHAIN_ID`
   - `NEXT_PUBLIC_SEPOLIA_RPC_URL`
4. Deploy!

### Contract Deployment
```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test
npx hardhat test test/ConfidentialVote.ts

# Test on Sepolia
npx hardhat test --network sepolia
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Built for Zama Developer Program

This project was created for the Zama Developer Program competition, showcasing:
- **FHEVM Integration**: Real homomorphic encryption in both contracts and frontend
- **Professional Design**: Banking-grade UI/UX
- **Complete dApp**: Full-stack application with smart contracts and frontend
- **Security Focus**: Privacy-first approach to voting

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Contract**: [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x10eF703ed9520d97A6750864c8fF3c2363132f19)
- **Zama**: [zama.ai](https://zama.ai)
- **FHEVM Docs**: [docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/ZamaVault/issues)
- **Documentation**: [FHEVM Documentation](https://docs.zama.ai/fhevm)
- **Community**: [Zama Discord](https://discord.zama.ai)

---

**Built with ❤️ using Zama FHEVM**