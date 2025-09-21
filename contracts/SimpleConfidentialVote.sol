// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SimpleConfidentialVote - A simplified voting system for testing
/// @notice This version bypasses FHE for testing on Sepolia while maintaining the same interface
contract SimpleConfidentialVote {
    
    struct Poll {
        string title;
        string[] options;
        uint32[] votes; // Simple vote counts instead of encrypted
        uint256 endTime;
        address creator;
        bool isActive;
        mapping(address => bool) hasVoted;
        uint256 totalVoters;
    }
    
    mapping(uint256 => Poll) public polls;
    uint256 public pollCount;
    address public owner;
    
    event PollCreated(uint256 indexed pollId, string title, address indexed creator, uint256 endTime);
    event VoteCast(uint256 indexed pollId, address indexed voter);
    event PollEnded(uint256 indexed pollId);
    event PollDeleted(uint256 indexed pollId);
    
    constructor() {
        owner = 0xAc7539F65d98313ea4bAbef870F6Ae29107aD4ce; // Fixed admin address
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only admin can call this function");
        _;
    }
    
    modifier onlyCreatorOrOwner(uint256 pollId) {
        require(
            msg.sender == polls[pollId].creator || msg.sender == owner,
            "Only poll creator or admin can call this function"
        );
        _;
    }
    
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
    
    /// @notice Creates a new poll
    function createPoll(
        string memory title,
        string[] memory options,
        uint256 durationInHours
    ) external returns (uint256) {
        require(options.length >= 2, "Poll must have at least 2 options");
        require(options.length <= 10, "Poll cannot have more than 10 options");
        require(durationInHours > 0 && durationInHours <= 168, "Duration must be 1-168 hours");
        
        uint256 pollId = pollCount++;
        Poll storage newPoll = polls[pollId];
        
        newPoll.title = title;
        newPoll.options = options;
        newPoll.endTime = block.timestamp + (durationInHours * 1 hours);
        newPoll.creator = msg.sender;
        newPoll.isActive = true;
        newPoll.totalVoters = 0;
        
        // Initialize vote counts to 0 for each option
        for (uint i = 0; i < options.length; i++) {
            newPoll.votes.push(0);
        }
        
        emit PollCreated(pollId, title, msg.sender, newPoll.endTime);
        return pollId;
    }
    
    /// @notice Cast a vote (simplified - no FHE for testing)
    function vote(
        uint256 pollId,
        uint256 optionIndex,
        bytes32 encryptedVote, // Ignored for testing
        bytes calldata inputProof // Ignored for testing
    ) external 
        pollExists(pollId) 
        pollActive(pollId) 
        hasNotVoted(pollId) 
    {
        Poll storage poll = polls[pollId];
        require(optionIndex < poll.options.length, "Invalid option index");
        
        // Simplified voting - just increment the count
        poll.votes[optionIndex] += 1;
        
        // Mark that this address has voted
        poll.hasVoted[msg.sender] = true;
        poll.totalVoters++;
        
        emit VoteCast(pollId, msg.sender);
    }
    
    /// @notice End a poll manually (creator or admin)
    function endPoll(uint256 pollId) external pollExists(pollId) onlyCreatorOrOwner(pollId) {
        Poll storage poll = polls[pollId];
        require(poll.isActive, "Poll already ended");
        
        poll.isActive = false;
        emit PollEnded(pollId);
    }
    
    /// @notice Get vote count for a specific option (returns plain count for testing)
    function getVoteCount(uint256 pollId, uint256 optionIndex) 
        external 
        view 
        pollExists(pollId) 
        returns (uint32) 
    {
        require(optionIndex < polls[pollId].options.length, "Invalid option index");
        return polls[pollId].votes[optionIndex];
    }
    
    /// @notice Get poll information
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
    function hasVotedInPoll(uint256 pollId, address voter) 
        external 
        view 
        pollExists(pollId) 
        returns (bool) 
    {
        return polls[pollId].hasVoted[voter];
    }
    
    /// @notice Get the total number of polls created
    function getTotalPolls() external view returns (uint256) {
        return pollCount;
    }
    
    /// @notice Check if a poll is still active
    function isPollActive(uint256 pollId) 
        external 
        view 
        pollExists(pollId) 
        returns (bool) 
    {
        Poll storage poll = polls[pollId];
        return poll.isActive && block.timestamp < poll.endTime;
    }
    
    /// @notice Delete a poll (creator or admin only)
    function deletePoll(uint256 pollId) 
        external 
        onlyCreatorOrOwner(pollId)
        pollExists(pollId) 
    {
        // Mark poll as inactive and clear data
        polls[pollId].isActive = false;
        polls[pollId].title = "";
        delete polls[pollId].options;
        delete polls[pollId].votes;
        polls[pollId].totalVoters = 0;
        
        emit PollDeleted(pollId);
    }
    
    /// @notice Clear all polls (only owner) - for fresh start
    function clearAllPolls() external onlyOwner {
        for (uint256 i = 0; i < pollCount; i++) {
            if (polls[i].isActive) {
                polls[i].isActive = false;
                polls[i].title = "";
                delete polls[i].options;
                delete polls[i].votes;
                polls[i].totalVoters = 0;
                emit PollDeleted(i);
            }
        }
        // Reset poll count for fresh start
        pollCount = 0;
    }
    
    /// @notice Get the winning option(s) for a poll
    function getWinner(uint256 pollId) 
        external 
        view 
        pollExists(pollId) 
        returns (
            uint256[] memory winningOptions,
            uint32 maxVotes,
            bool hasTie
        ) 
    {
        Poll storage poll = polls[pollId];
        require(poll.totalVoters > 0, "No votes cast");
        
        // Find maximum votes
        maxVotes = 0;
        for (uint256 i = 0; i < poll.votes.length; i++) {
            if (poll.votes[i] > maxVotes) {
                maxVotes = poll.votes[i];
            }
        }
        
        // Count how many options have max votes
        uint256 winnerCount = 0;
        for (uint256 i = 0; i < poll.votes.length; i++) {
            if (poll.votes[i] == maxVotes) {
                winnerCount++;
            }
        }
        
        // Create array of winning options
        winningOptions = new uint256[](winnerCount);
        uint256 index = 0;
        for (uint256 i = 0; i < poll.votes.length; i++) {
            if (poll.votes[i] == maxVotes) {
                winningOptions[index] = i;
                index++;
            }
        }
        
        hasTie = winnerCount > 1;
    }
}
