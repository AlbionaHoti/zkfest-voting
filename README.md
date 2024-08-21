# ZKFest Voting System on ZKsync Era

This project was scaffolded with [zksync-cli](https://github.com/matter-labs/zksync-cli).

This project demonstrates a simple voting system for ZKFest, implemented on ZKsync Era. It showcases how to deploy and interact with smart contracts while considering pubdata costs.

## Smart Contract: ZKFestVoting.sol

The `ZKFestVoting` contract allows participants to vote for different stages of ZKFest.

Key features:

- Supports voting for three stages: Culture, DeFi, and ElasticChain.
- Prevents double voting for the same stage.
- Tracks voter participation across all stages.

### Main Functions

1. `vote(Stage stage)`: Allows a user to vote for a specific stage.
2. `voterStages(address voter)`: Returns an array indicating which stages a voter has participated in.

The contract uses bitwise operations to efficiently store voting data, which helps minimize storage costs and, consequently, pubdata costs on ZKsync Era.

## Deployment Script: deploy.ts

The deployment script (`deploy.ts`) is responsible for deploying the `ZKFestVoting` contract and demonstrating various interaction scenarios. It's designed to showcase how different parameters affect transaction execution and costs on ZKsync Era.

### Key Components

1. **Contract Deployment**
   - Uses `deployer.deploy()` to deploy the `ZKFestVoting` contract.
   - Estimates and logs the deployment fee.
   - Enables automatic contract verification on ZKsync's block explorer.

2. **Wallet Setup**
   - Creates a wallet instance using a private key from environment variables.
   - Connects the wallet to the ZKsync provider.

3. **Test Scenarios**
   - Defines multiple test scenarios with varying `gasPerPubdata` and `gasLimit` values.
   - Each scenario attempts to vote for a specific stage using custom transaction parameters.

4. **Custom Transaction Creation**
   - `createCustomTx()` function builds ZKsync-specific transactions (type 113).
   - Allows setting custom `gasPerPubdata` and `gasLimit` values.
   - Demonstrates how to construct transactions with ZKsync-specific features.

5. **Transaction Execution and Monitoring**
   - Sends transactions using `wallet.sendTransaction()`.
   - Implements a timeout mechanism for transaction confirmation.
   - Logs detailed information about each transaction, including gas used and errors.

6. **Error Handling and Logging**
   - Catches and logs any errors that occur during deployment or transaction execution.
   - Provides informative console output for easy debugging and analysis.

### Usage

To run the deployment script:

1. Ensure your `.env` file is set up with the correct `WALLET_PRIVATE_KEY`.
2. Run the script using: `npx hardhat deploy-zksync --script deploy.ts`

The script will:

1. Deploy the `ZKFestVoting` contract.
2. Execute a series of test votes with different `gasPerPubdata` and `gasLimit` settings.
3. Log the results of each transaction, including gas usage and any errors encountered.

This deployment script serves as a practical example of how to interact with ZKsync\ Era, showcasing the impact of different gas settings on transaction execution and costs.

## Understanding Pubdata Costs

(Note: This section will be expanded in a separate file to provide a deeper explanation of pubdata costs on ZKsync Era.)

The `gasPerPubdata` parameter in ZKsync Era transactions allows developers to specify how much they're willing to pay for each byte of published data. This is a unique feature of ZKsync that helps in fine-tuning transaction costs, especially for operations that require significant data to be published on-chain.

By experimenting with different `gasPerPubdata` values in the deployment script, you can observe how it affects transaction success and overall gas costs in various scenarios.

## In-Depth: Gas Per Pubdata Mechanics

Understanding the intricacies of `gasPerPubdata` is crucial for developers working with zkSync Era. Let's dive into some key aspects:

### Transaction Gas Limits and Pubdata

- ZKsync Era has a gas limit for each transaction, imposed by prover/circuits restrictions.
- This gas limit covers both computation and pubdata publishing.
- It introduces an upper bound for `gasPerPubdata`.
- If `gasPerPubdata` is set too high, users might not be able to publish significant amounts of pubdata within a single transaction.

### Post-Charging Approach

Unlike calldata-based rollups that precharge for data, ZKsync Era uses a post-charging approach:

1. Exact state diffs are only known after transaction execution.
2. A counter tracks pubdata usage during execution.
3. Users are charged for pubdata at the end of the transaction.

### Challenges and Solutions

- **Challenge**: Users might spend all gas on computation, leaving none for pubdata.
- **Solution**: If there's insufficient gas for pubdata, the transaction is reverted.
- **Outcome**: Users pay for computation, but no state changes (and thus no pubdata) are produced.

### Benefits of Post-Charging

1. Removes unnecessary overhead.
2. Decouples gas used for execution from gas used for data availability.
3. Eliminates caps on `gasPerPubdata`.
4. Allows users to provide as much gas as needed for pubdata, separate from computation limits.

### Gas Charging Mechanism

- Gas is charged whenever pubdata is published.
- This approach allows for more accurate and fair pricing based on actual pubdata usage.

### Implications for Developers

1. **Gas Estimation**: Account for both computation and potential pubdata costs.
2. **Error Handling**: Implement robust error handling for cases where transactions might revert due to insufficient gas for pubdata.
3. **Transaction Design**: Optimize transactions to balance computation and pubdata usage.
4. **Testing**: Thoroughly test with various `gasPerPubdata` settings to ensure transaction success under different network conditions.

By understanding these mechanics, developers can create more efficient and reliable applications on ZKsync Era, taking full advantage of its unique approach to handling pubdata costs.


# How Max Gas Per Pubdata Works on ZKsync Era--A Technical Deep Dive

## Introduction

...
[] what I need to learn is: 

## What is Max Gas Per Pubdata?

Max gas per pubdata is a value attached to each transaction on ZKsync Era, representing the maximum amount of gas a user is willing to pay for each byte of pubdata (public data) published on Ethereum.

Key points:

1. Default value: 50,000 gas per pubdata byte
2. Can be customized per transaction
3. Affects transaction success and cost

## How It Works

1. **Transaction Submission**: When sending a transaction, you specify the max gas per pubdata.
2. **Execution**: ZKsync executes the transaction and calculates the actual pubdata cost.
3. **Comparison**: The actual cost is compared against your specified max value.
4. **Outcome**:
   - If actual cost ≤ specified max: Transaction succeeds
   - If actual cost > specified max: Transaction fails

## Why ZKsync Chose This Approach

1. Flexibility in adjusting to L1 gas price fluctuations
2. Allows users to set limits on pubdata costs
3. Optimizes L1 data availability costs

## Technical Example: ZKFest Voting Contract

Let's examine how max gas per pubdata works with a real contract

### ZKFestVoting Contract

```solidity
contract ZKFestVoting {
    mapping(address => uint8) public participation;

    function vote(string memory stageName) external {
        uint256 stageIndex = getStageIndex(stageName);
        require(stageIndex < 3, "Invalid stage");
        uint256 stageBit = 1 << stageIndex;
        
        require((participation[msg.sender] & stageBit) == 0, "Already voted for this stage");

        emit Voted(msg.sender, Stage(stageIndex));
    }
    // ... other functions ...

}

```

### Deployment and interaction script

```typescript
import { deployContract, getProvider, getWallet } from "./utils";
import { Deployer } from "@matterlabs/hardhat-zksync";
import * as hre from "hardhat";
import { ethers } from "ethers";

export default async function () {
    const wallet = getWallet();
    const deployer = new Deployer(hre, wallet);
    
    // Deploy contract
    const artifact = await deployer.loadArtifact("ZKFestVoting");
    const contract = await deployContract("ZKFestVoting", []);

    // Function to send transaction with custom gas settings
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

    // Create custom transaction
    const createCustomTx = async (gasPerPubdata: string | number, gasLimit: string | number, stageName: string) => {

      const voteFunctionData = contract.interface.encodeFunctionData("vote", [stageName]); 

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
}
```

This script demonstrates:

1. Deploying the ZKFestVoting contract
2. Creating transactions with custom gas per pubdata settings
3. Testing different scenarios to observe the impact of gas per pubdata

## Block Explorer View

After running these transactions, you can verify their execution on the ZKsync Era block explorer. Here's an example of what you might see:

[insert picture]

```

This real transaction shows:

1. The default gas per pubdata (50,000) was sufficient
2. Only 4.28% of the gas limit was used, indicating efficiency
3. The low fee demonstrates ZKsync Era's cost-effectiveness

## Conclusion

Understanding and properly configuring max gas per pubdata is crucial for efficient development on ZKsync Era. By carefully managing this parameter, developers can create more economical and user-friendly decentralized applications while leveraging zkSync's scaling benefits.



## Project Layout

- `/contracts`: Contains solidity smart contracts.
- `/deploy`: Scripts for contract deployment and interaction.
- `/test`: Test files.
- `hardhat.config.ts`: Configuration settings.

## How to Use

- `npm run compile`: Compiles contracts.
- `npm run deploy`: Deploys using script `/deploy/deploy.ts`.
- `npm run interact`: Interacts with the deployed contract using `/deploy/interact.ts`.
- `npm run test`: Tests the contracts.

Note: Both `npm run deploy` and `npm run interact` are set in the `package.json`. You can also run your files directly, for example: `npx hardhat deploy-zksync --script deploy.ts`

### Environment Settings

To keep private keys safe, this project pulls in environment variables from `.env` files. Primarily, it fetches the wallet's private key.

Rename `.env.example` to `.env` and fill in your private key:

```
WALLET_PRIVATE_KEY=your_private_key_here...
```

### Network Support

`hardhat.config.ts` comes with a list of networks to deploy and test contracts. Add more by adjusting the `networks` section in the `hardhat.config.ts`. To make a network the default, set the `defaultNetwork` to its name. You can also override the default using the `--network` option, like: `hardhat test --network dockerizedNode`.


## Useful Links

- [Docs](https://era.zksync.io/docs/dev/)
- [Official Site](https://zksync.io/)
- [GitHub](https://github.com/matter-labs)
- [Twitter](https://twitter.com/zksync)
- [Discord](https://join.zksync.dev/)

## License

This project is under the [MIT](./LICENSE) license.