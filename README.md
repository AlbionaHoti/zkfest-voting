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