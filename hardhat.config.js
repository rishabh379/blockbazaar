require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
const fs = require('fs');
// const infuraId = fs.readFileSync(".infuraid").toString().trim() || "";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 11155111
    },
    sepolia: { // Here Use your own key // This is a sample account
      url: "https://eth-sepolia.g.alchemy.com/v2/ImCo5EaxKphmGQ_DqeFqDcWrcwwqaneV",
      accounts: [ '04a20c12d4cc455e5442bfa6198ad18c77451c109fc6d0474cb6829c372e12b1' ]
    }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};