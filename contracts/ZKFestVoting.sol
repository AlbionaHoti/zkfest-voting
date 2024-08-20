// SPDX-License-Identitier: MIT
pragma solidity ^0.8.17;

contract ZKFestVoting {
    // Enum: A user-defined type that consts of a set of named constants, we're defining the stages of ZKFest
    enum Stage { Culture, DeFi, ElasticChain }

    // Mapping: A key-value data structure that allows for efficient data lookup
    mapping(address => uint8) public participation;

    // Event: A way to emit logs on the blockchain, useful for off-chain applications 
    event Voted(address indexed voter, Stage stage);

    /* 
        Vote function: allows a user to vote for a stage
        - converts stage name to index
        - checks for valid state and prevents double voting
        - uses bit manipulation (1 << stageIndex) to efficiently store votes in single uint8
        - updates participation using bitwise OR (|=)
    */
    function vote(string memory stageName) external {
        uint256 stageIndex = getStageIndex(stageName);
        require(stageIndex < 3, "Invalid stage");
        uint256 stageBit = 1 << stageIndex; // 1 left shifted by stageIndex
        
        // Check if the user has already voted for the stage, the participattion is checking the transaction sender and the stageBit is the stage the user is voting for
        require((participation[msg.sender] & stageBit) == 0, "Already voted for this stage");

        // emit does not store data, it only logs the event, in this case it's logging the voter and the stage
        emit Voted(msg.sender, Stage(stageIndex));
    }

    // Helper function to get the index of the stage
    function getStageIndex(string memory stageName) internal pure returns (uint256) {
        // the goal of the if statements is to convert the stageName to an index, the keccak256 is a hash function that converts the stageName to a hash, 
        // and we're checking if the hash of the stageName is equal to the hash of the string "Culture"
        // we're using bytes to convert the stageName to a byte array, because keccak256 expects a byte array
        if (keccak256(bytes(stageName)) == keccak256(bytes("Culture"))) return 0;
        if (keccak256(bytes(stageName)) == keccak256(bytes("DeFi"))) return 1;
        if (keccak256(bytes(stageName)) == keccak256((bytes("ElasticChain")))) return 2;
        revert("Invalid stage name");
    }

    function hasVoted(address voter, Stage stage) external view returns (bool) {
        return (participation[voter] & (1 << uint256(stage))) != 0;
        // explain in detail what the above line does:
        // 1. participation[voter] is the bitmask of the voter's votes, bitmask in solidity is a way to store multiple boolean values in a single variable
        // 2. (1 << uint256(stage)) is the bitmask of the stage, it's a 1 left shifted by the stage index
        // 3. & is the bitwise AND operator, it's used to check if the voter has voted for the stage
        // 4. != 0 is used to check if the voter has voted for the stage
    }

    function voterStages(address voter) external view returns (bool[3] memory) {
        uint8 participationBits = participation[voter];

        return [
            participationBits & (1 << 0) != 0, // Check Culture stage
            participationBits & (1 << 1) != 0, // Check DeFi stage
            participationBits & (1 << 2) != 0 // Check ElsticChain stage
        ];
    }
}