# Tools 

A Node.js tool for deploying ERC-20 compatible tokens on network. and automating token transfers to list addresses

## Features

- One-click token deployment 
- Automated token transfers to Addresses on file addresses.txt
- Real-time transaction status updates
- Simple interactive prompt-based interface

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A wallet with Fund

## Installation

```bash
# Clone the repository
git clone https://github.com/Pizaru/CreateTokenAndTransfer.git

# Navigate to the project directory
cd CreateTokenAndTransfer

# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory with your private key:

```
PRIVATE_KEY=your_private_key_here
```

> ⚠️ **SECURITY WARNING**: Never share your private key or commit the .env file to GitHub.

Create a `addresses.txt` file in the root directory with your address list:

```
0x123..
0x1234..
0x1111
```

Change a `const provider = new ethers.providers.JsonRpcProvider("RPCURL");` in file to your rpc, example:

```
const provider = new ethers.providers.JsonRpcProvider("https://tea-sepolia.g.alchemy.com/public");`
```

## Usage

Run the tool with:

```bash
node main.js
```

The interactive CLI will guide you through:

1. Token creation and deploy (name, symbol, total supply)
2. Token Transfer

## Token Contract

The script deploys a standard ERC-20 compatible token contract with the following features:

- Token name, symbol, and decimals
- Balance tracking for addresses
- Transfer and approval functionality
- Standard ERC-20 events