const { ethers } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Starting NFTMarketplace deployment...");
  
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.getBalance();
  
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

  const Marketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  console.log("⏳ Deploying NFTMarketplace...");
  
  const marketplace = await Marketplace.deploy();
  await marketplace.deployed();

  console.log("✅ NFTMarketplace deployed to:", marketplace.address);
  console.log("🔗 Network:", hre.network.name);
  
  // Get contract details
  const listPrice = await marketplace.getListPrice();
  console.log("💵 Listing fee:", ethers.utils.formatEther(listPrice), "ETH");

  const data = {
    address: marketplace.address,
    abi: JSON.parse(marketplace.interface.format('json')),
    network: hre.network.name,
    deployer: deployer.address,
    listPrice: listPrice.toString()
  }

  // Write contract data to frontend
  fs.writeFileSync('./src/Marketplace.json', JSON.stringify(data, null, 2));
  console.log("📄 Contract ABI and address saved to ./src/Marketplace.json");
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Contract verification command:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${marketplace.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
