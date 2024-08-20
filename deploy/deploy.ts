import { deployContract, getProvider, getWallet } from "./utils";
import { Deployer } from "@matterlabs/hardhat-zksync";

import * as hre from "hardhat";
import { ethers } from "ethers";
import { utils } from "zksync-ethers";


export default async function () {
  console.log("Deploying ZKFestVoting contract...");

  // Get the wallet to deploy from
  const wallet = getWallet();
  const provider = getProvider();
  console.log(`Deploying from address: ${wallet.address}`);

  const deployer = new Deployer(hre, wallet);

  try {
    // Deploy the contract
    // Note: We're not passing any constructor arguments here
    const artifact = await deployer.loadArtifact("ZKFestVoting");
    const deploymentFee = await deployer.estimateDeployFee(artifact, []);
    console.log(`Estimated deployment fee: ${ethers.formatEther(deploymentFee)} ETH`);

    const contract = await deployContract("ZKFestVoting", [], {
      wallet: wallet,
      // Set to false if you want the contract to be verified automatically
      noVerify: false
    });



    const contractAddress = await contract.getAddress();
    console.log(`ZKFestVoting deployed to: ${contractAddress}`);



    // Test different scenarios
    const stageNames = ["Culture", "DeFi", "ElasticChain"];
    let currentStageIndex = 0;

    const sendAndExplainTx = async (gasPerPubdata: string | number, gasLimit: string | number) => {
      console.log(`\nTesting with gasPerPubdata: ${gasPerPubdata}, gasLimit: ${gasLimit}`);
      try {
        const stageName = stageNames[currentStageIndex]; 
        currentStageIndex++;

        const customTx = await createCustomTx(gasPerPubdata, gasLimit, stageName);
        console.log(`Voting for stage: ${stageName}`);

        console.log("Custom transaction created, attempting to send...");

        const txResponse = await wallet.sendTransaction(customTx);
        console.log(`Transaction sent. Hash: ${txResponse.hash}`);
        console.log("Transaction sent, waiting for confirmation...");

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Transaction confirmation timeout")), 60000) // 60 second timeout
        );

        // const receipt = await txResponse.wait();
        const receiptPromise = txResponse.wait();

        // const receipt = await Promise.race([receiptPromise, timeoutPromise]);
        const receipt = await Promise.race([receiptPromise, timeoutPromise]) as ethers.TransactionReceipt;

        console.log("Transaction successful!");
        console.log(`Gas used: ${receipt.gasUsed}`);
      } catch (error) {
          console.log("Transaction failed!");
          console.error("Error details:", error);
          if (error instanceof Error) {
            console.error("Error message:", error.message);
          }
      }
    }

    // Move this function outside of main
    const createCustomTx = async (gasPerPubdata: string | number, gasLimit: string | number, stageName: string) => {

      // const voteFunctionData = contract.interface.encodeFunctionData("vote", [0]); // Vote for Culture stage
      const voteFunctionData = contract.interface.encodeFunctionData("vote", [stageName]); // Vote for Culture stage
      // we add stageName as a string to the array because the encodeFunctionData expects an array

      const gasPrice = await provider.getGasPrice();

      let customTx = {
        to: contractAddress,
        from: wallet.address,
        data: voteFunctionData,
        gasLimit: ethers.getBigInt(gasLimit),
        gasPrice: gasPrice,
        chainId: (await provider.getNetwork()).chainId,
        nonce: await provider.getTransactionCount(wallet.address),
        type: 113,
        customData: {
          gasPerPubdata: ethers.getBigInt(gasPerPubdata)
        },
        value: ethers.getBigInt(0),
      };

      return customTx;
    }


    // Test different scenarios
    await sendAndExplainTx(utils.DEFAULT_GAS_PER_PUBDATA_LIMIT, "2000000");
    await sendAndExplainTx("100", "2000000"); // Very low gasPerPubdata
    await sendAndExplainTx(utils.DEFAULT_GAS_PER_PUBDATA_LIMIT, "100000000"); // Very high gasLimit


    // // Get and log the transaction receipt for the vote
    // const receipt = await deployContract
  } catch (error) {
    console.error("Deployment or interaction failed: ", error);
    process.exitCode = 1;
  }
}