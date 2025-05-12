# EffortAce

EffortAce is a Web3 learning platform designed to help users learn blockchain concepts and earn rewards through interactive challenges and games. The project integrates a modern frontend, a robust backend, and smart contracts to provide a seamless learning experience.

## Project Structure

```
EffortAce/
├── .git/                  # Git repository
├── .next/                 # Next.js build output
├── src/                   # Source code for Next.js app
├── frontend/              # Frontend code
│   └── retro-pixel-blog/  # Next.js frontend project
├── backend/               # Backend code (Node.js/Express)
├── contract/              # Smart contract code (Solidity/Hardhat/Foundry)
├── package.json           # Root package.json
├── next.config.js         # Next.js configuration
├── help.md                # Help documentation
└── TokenSwap.sol          # Smart contract for token swapping
```

## Features

- **Interactive Learning**: Engage with blockchain concepts through interactive challenges.
- **Earn Rewards**: Complete tasks and earn tokens as rewards.
- **Real-time Updates**: Use Socket.IO for real-time communication between users and the platform.
- **Smart Contracts**: Integrate with Ethereum-based smart contracts for token management and rewards.

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MetaMask or another Ethereum wallet

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/EffortAce.git
   cd EffortAce
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

- **Frontend**: Access the application at `http://localhost:3000`.
- **Backend**: The backend server runs on `http://localhost:5000`.
- **Smart Contracts**: Deploy and interact with smart contracts using Hardhat or Foundry.

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO, SQLite
- **Smart Contracts**: Solidity, Hardhat, Foundry

## Smart Contracts

The project includes several smart contracts for token management and rewards. For more details, see the `contract/README.md`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. 