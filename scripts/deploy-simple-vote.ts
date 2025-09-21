import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SimpleConfidentialVote contract...");

  const SimpleConfidentialVote = await ethers.getContractFactory("SimpleConfidentialVote");
  const simpleVote = await SimpleConfidentialVote.deploy();

  await simpleVote.waitForDeployment();

  const contractAddress = await simpleVote.getAddress();
  
  console.log("SimpleConfidentialVote deployed to:", contractAddress);
  console.log("Admin address:", "0xAc7539F65d98313ea4bAbef870F6Ae29107aD4ce");
  
  console.log("\nTo verify on Etherscan, run:");
  console.log(`npx hardhat verify --network sepolia ${contractAddress}`);
  
  console.log("\nUpdate frontend/.env.local with:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
