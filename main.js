const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const readline = require("readline");
const solc = require("solc");

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const provider = new ethers.providers.JsonRpcProvider("RPCURL");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);

const tokenSource = `
pragma solidity ^0.8.13;
contract NamaToken {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * 10**uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    function transfer(address to, uint256 value) public returns (bool success) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    function approve(address spender, uint256 value) public returns (bool success) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        require(value <= balanceOf[from], "Insufficient balance");
        require(value <= allowance[from][msg.sender], "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
`;

function compileTokenContract(source, contractName = "NamaToken") {
  const input = {
    language: "Solidity",
    sources: {
      "Token.sol": { content: source },
    },
    settings: {
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode"] },
      },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts["Token.sol"][contractName];
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
  };
}

async function deployToken(name, symbol, supply) {
  const { abi, bytecode } = compileTokenContract(tokenSource);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(name, symbol, supply, { gasLimit: 3000000 });
  console.log(`${colors.green}✅ Deploying... TX: ${contract.deployTransaction.hash}${colors.reset}`);
  await contract.deployTransaction.wait();
  console.log(`${colors.green}🎉 Token Deployed at: ${contract.address}${colors.reset}`);
  return { contractAddress: contract.address, abi };
}

function readAddressFile(filename = "addresses.txt") {
  const content = fs.readFileSync(filename, "utf-8");
  return content.split(/\r?\n/).map((a) => a.trim()).filter(Boolean);
}

async function transferToAddresses(contractAddress, abi, amount) {
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  const addresses = readAddressFile();

  console.log(`📄 Loaded ${addresses.length} address(es) from file`);
  for (let i = 0; i < addresses.length; i++) {
    const recipient = addresses[i];
    try {
      const tx = await contract.transfer(recipient, ethers.utils.parseUnits(amount.toString(), 18));
      console.log(`⏳ [${i + 1}] Transfer to ${recipient} - TX: ${tx.hash}`);
      await tx.wait();
      console.log(`${colors.green}✅ Success${colors.reset}`);
    } catch (err) {
      console.log(`${colors.red}❌ Failed to ${recipient}: ${err.message}${colors.reset}`);
    }
    await delay(1000); // Delay 1 detik
  }
}

function mainMenu() {
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}🌐 TOOLS 🌐${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log("1. Create & Deploy Token");
  console.log("2. Transfer Token to Address List");
  console.log("0. Exit");

  rl.question("\nSelect an option: ", async (answer) => {
    if (answer === "1") {
      rl.question("📝 Token Name: ", (name) => {
        rl.question("🔤 Token Symbol: ", (symbol) => {
          rl.question("💰 Total Supply: ", async (supply) => {
            try {
              await deployToken(name, symbol, parseInt(supply));
            } catch (e) {
              console.error(colors.red + "❌ Deploy failed:", e.message + colors.reset);
            } finally {
              rl.close();
            }
          });
        });
      });
    } else if (answer === "2") {
      rl.question("🧾 Contract Address: ", (addr) => {
        rl.question("💸 Amount per Address: ", async (amount) => {
          try {
            const { abi } = compileTokenContract(tokenSource);
            await transferToAddresses(addr, abi, parseFloat(amount));
          } catch (e) {
            console.error(colors.red + "❌ Transfer failed:", e.message + colors.reset);
          } finally {
            rl.close();
          }
        });
      });
    } else {
      console.log("👋 Exit");
      rl.close();
    }
  });
}

mainMenu();
