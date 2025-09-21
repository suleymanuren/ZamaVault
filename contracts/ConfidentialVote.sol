// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialVote - A privacy-preserving voting system using FHE
/// @notice Allows creation of polls with encrypted votes that maintain privacy until results are revealed
contract ConfidentialVote is SepoliaConfig {
    
    struct Poll {
        string title;
        string[] options;
        euint32[] votes; // Encrypted vote counts for each option
        uint256 endTime;
        address creator;
        bool isActive;
        mapping(address => bool) hasVoted;
        uint256 totalVoters;
    }
    
    mapping(uint256 => Poll) public polls;
    uint256 public pollCount;
    
    event PollCreated(uint256 indexed pollId, string title, address indexed creator, uint256 endTime);
    event VoteCast(uint256 indexed pollId, address indexed voter);
    event PollEnded(uint256 indexed pollId);
    
    modifier pollExists(uint256 pollId) {
        require(pollId < pollCount, "Poll does not exist");
        _;
    }
    
    modifier pollActive(uint256 pollId) {
        require(polls[pollId].isActive, "Poll is not active");
        require(block.timestamp < polls[pollId].endTime, "Poll has ended");
        _;
    }
    
    modifier hasNotVoted(uint256 pollId) {
        require(!polls[pollId].hasVoted[msg.sender], "Already voted");
        _;
    }
    
    /// @notice Creates a new poll with encrypted vote counting
    /// @param title The title of the poll
    /// @param options Array of voting options
    /// @param durationInHours How long the poll should run
    function createPoll(
        string memory title,
        string[] memory options,
        uint256 durationInHours
    ) external returns (uint256) {
        require(options.length >= 2, "Poll must have at least 2 options");
        require(options.length <= 10, "Poll cannot have more than 10 options");
        require(durationInHours > 0 && durationInHours <= 168, "Duration must be 1-168 hours"); // Max 1 week
        
        uint256 pollId = pollCount++;
        Poll storage newPoll = polls[pollId];
        
        newPoll.title = title;
        newPoll.options = options;
        newPoll.endTime = block.timestamp + (durationInHours * 1 hours);
        newPoll.creator = msg.sender;
        newPoll.isActive = true;
        newPoll.totalVoters = 0;
        
        // Initialize encrypted vote counts to 0 for each option
        for (uint i = 0; i < options.length; i++) {
            euint32 zeroVotes = FHE.asEuint32(0);
            FHE.allowThis(zeroVotes);
            newPoll.votes.push(zeroVotes);
        }
        
        emit PollCreated(pollId, title, msg.sender, newPoll.endTime);
        return pollId;
    }
    
    /// @notice Cast an encrypted vote for a specific option
    /// @param pollId The ID of the poll
    /// @param optionIndex The index of the chosen option
    /// @param encryptedVote Encrypted vote value (should be 1)
    /// @param inputProof Proof for the encrypted input
    function vote(
        uint256 pollId,
        uint256 optionIndex,
        externalEuint32 encryptedVote,
        bytes calldata inputProof
    ) external 
        pollExists(pollId) 
        pollActive(pollId) 
        hasNotVoted(pollId) 
    {
        Poll storage poll = polls[pollId];
        require(optionIndex < poll.options.length, "Invalid option index");
        
        // Convert external encrypted input to internal encrypted type
        euint32 encryptedVoteValue = FHE.fromExternal(encryptedVote, inputProof);
        
        // Allow the contract to use the encrypted vote value
        FHE.allowThis(encryptedVoteValue);
        
        // Add the encrypted vote to the chosen option
        poll.votes[optionIndex] = FHE.add(poll.votes[optionIndex], encryptedVoteValue);
        
        // Mark that this address has voted
        poll.hasVoted[msg.sender] = true;
        poll.totalVoters++;
        
        // Allow the contract and voter to access the vote counts
        FHE.allowThis(poll.votes[optionIndex]);
        FHE.allow(poll.votes[optionIndex], msg.sender);
        
        emit VoteCast(pollId, msg.sender);
    }
    
    /// @notice End a poll manually (only creator can do this)
    /// @param pollId The ID of the poll to end
    function endPoll(uint256 pollId) external pollExists(pollId) {
        Poll storage poll = polls[pollId];
        require(
            msg.sender == poll.creator || block.timestamp >= poll.endTime,
            "Only creator can end poll early"
        );
        require(poll.isActive, "Poll already ended");
        
        poll.isActive = false;
        emit PollEnded(pollId);
    }
    
    /// @notice Get encrypted vote count for a specific option
    /// @param pollId The ID of the poll
    /// @param optionIndex The index of the option
    /// @return The encrypted vote count
    function getVoteCount(uint256 pollId, uint256 optionIndex) 
        external 
        view 
        pollExists(pollId) 
        returns (euint32) 
    {
        require(optionIndex < polls[pollId].options.length, "Invalid option index");
        return polls[pollId].votes[optionIndex];
    }
    
    /// @notice Get poll information
    /// @param pollId The ID of the poll
    /// @return title The title of the poll
    /// @return options Array of voting options
    /// @return endTime When the poll ends
    /// @return creator Address that created the poll
    /// @return isActive Whether the poll is active
    /// @return totalVoters Number of people who voted
    function getPollInfo(uint256 pollId) 
        external 
        view 
        pollExists(pollId) 
        returns (
            string memory title,
            string[] memory options,
            uint256 endTime,
            address creator,
            bool isActive,
            uint256 totalVoters
        ) 
    {
        Poll storage poll = polls[pollId];
        return (
            poll.title,
            poll.options,
            poll.endTime,
            poll.creator,
            poll.isActive,
            poll.totalVoters
        );
    }
    
    /// @notice Check if an address has voted in a poll
    /// @param pollId The ID of the poll
    /// @param voter The address to check
    /// @return Whether the address has voted
    function hasVotedInPoll(uint256 pollId, address voter) 
        external 
        view 
        pollExists(pollId) 
        returns (bool) 
    {
        return polls[pollId].hasVoted[voter];
    }
    
    /// @notice Get the total number of polls created
    /// @return The total poll count
    function getTotalPolls() external view returns (uint256) {
        return pollCount;
    }
    
    /// @notice Check if a poll is still active and accepting votes
    /// @param pollId The ID of the poll
    /// @return Whether the poll is active
    function isPollActive(uint256 pollId) 
        external 
        view 
        pollExists(pollId) 
        returns (bool) 
    {
        Poll storage poll = polls[pollId];
        return poll.isActive && block.timestamp < poll.endTime;
    }
}
