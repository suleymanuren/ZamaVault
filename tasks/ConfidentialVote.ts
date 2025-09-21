import { task, types } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("confidentialVote:createPoll")
  .addParam("title", "The title of the poll")
  .addParam("options", "Comma-separated list of options")
  .addOptionalParam("duration", "Duration in hours (default: 24)", 24, types.int)
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { title, options, duration } = taskArguments;
    const optionsArray = options.split(",").map((opt: string) => opt.trim());
    
    console.log(`Creating poll: "${title}"`);
    console.log(`Options: ${optionsArray.join(", ")}`);
    console.log(`Duration: ${duration} hours`);
    
    const signers = await ethers.getSigners();
    const confidentialVote = await ethers.getContractAt("ConfidentialVote", "0x10eF703ed9520d97A6750864c8fF3c2363132f19");
    
    const tx = await confidentialVote.connect(signers[0]).createPoll(title, optionsArray, duration);
    const receipt = await tx.wait();
    
    console.log(`Poll created! Transaction hash: ${receipt.hash}`);
    
    const totalPolls = await confidentialVote.getTotalPolls();
    const pollId = totalPolls - 1n;
    
    console.log(`Poll ID: ${pollId}`);
    
    const pollInfo = await confidentialVote.getPollInfo(pollId);
    console.log(`Poll Info:`, {
      title: pollInfo.title,
      options: pollInfo.options,
      endTime: new Date(Number(pollInfo.endTime) * 1000).toLocaleString(),
      creator: pollInfo.creator,
      isActive: pollInfo.isActive,
      totalVoters: pollInfo.totalVoters.toString()
    });
  });

task("confidentialVote:getPollInfo")
  .addParam("pollid", "The ID of the poll", undefined, types.int)
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { pollid } = taskArguments;
    
    const confidentialVote = await ethers.getContractAt("ConfidentialVote", "0x10eF703ed9520d97A6750864c8fF3c2363132f19");
    
    try {
      const pollInfo = await confidentialVote.getPollInfo(pollid);
      
      console.log(`Poll #${pollid} Information:`);
      console.log(`Title: ${pollInfo.title}`);
      console.log(`Options: ${pollInfo.options.join(", ")}`);
      console.log(`End Time: ${new Date(Number(pollInfo.endTime) * 1000).toLocaleString()}`);
      console.log(`Creator: ${pollInfo.creator}`);
      console.log(`Is Active: ${pollInfo.isActive}`);
      console.log(`Total Voters: ${pollInfo.totalVoters.toString()}`);
      
      const isActive = await confidentialVote.isPollActive(pollid);
      console.log(`Currently Accepting Votes: ${isActive}`);
      
    } catch (error) {
      console.error("Error getting poll info:", error);
    }
  });

task("confidentialVote:listPolls")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const confidentialVote = await ethers.getContractAt("ConfidentialVote", "0x10eF703ed9520d97A6750864c8fF3c2363132f19");
    
    const totalPolls = await confidentialVote.getTotalPolls();
    console.log(`Total polls created: ${totalPolls}`);
    
    if (totalPolls === 0n) {
      console.log("No polls found.");
      return;
    }
    
    for (let i = 0; i < Number(totalPolls); i++) {
      try {
        const pollInfo = await confidentialVote.getPollInfo(i);
        const isActive = await confidentialVote.isPollActive(i);
        
        console.log(`\n--- Poll #${i} ---`);
        console.log(`Title: ${pollInfo.title}`);
        console.log(`Options: ${pollInfo.options.join(", ")}`);
        console.log(`Creator: ${pollInfo.creator}`);
        console.log(`Total Voters: ${pollInfo.totalVoters.toString()}`);
        console.log(`Status: ${isActive ? "Active" : "Ended"}`);
        console.log(`End Time: ${new Date(Number(pollInfo.endTime) * 1000).toLocaleString()}`);
      } catch (error) {
        console.error(`Error getting info for poll ${i}:`, error);
      }
    }
  });

task("confidentialVote:vote")
  .addParam("pollid", "The ID of the poll", undefined, types.int)
  .addParam("option", "The index of the option to vote for", undefined, types.int)
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { pollid, option } = taskArguments;
    
    console.log(`Voting in poll ${pollid} for option ${option}`);
    
    const signers = await ethers.getSigners();
    const voter = signers[0];
    const confidentialVote = await ethers.getContractAt("ConfidentialVote", "0x10eF703ed9520d97A6750864c8fF3c2363132f19");
    const contractAddress = await confidentialVote.getAddress();
    
    // Check if user has already voted
    const hasVoted = await confidentialVote.hasVotedInPoll(pollid, voter.address);
    if (hasVoted) {
      console.log("You have already voted in this poll!");
      return;
    }
    
    // Check if poll is active
    const isActive = await confidentialVote.isPollActive(pollid);
    if (!isActive) {
      console.log("This poll is no longer active!");
      return;
    }
    
    try {
      // Encrypt vote value (1 = one vote)
      const voteValue = 1;
      const encryptedVote = await fhevm
        .createEncryptedInput(contractAddress, voter.address)
        .add32(voteValue)
        .encrypt();
      
      console.log("Casting encrypted vote...");
      
      const tx = await confidentialVote
        .connect(voter)
        .vote(pollid, option, encryptedVote.handles[0], encryptedVote.inputProof);
      
      const receipt = await tx.wait();
      
      console.log(`Vote cast successfully! Transaction hash: ${receipt.hash}`);
      
      // Show updated poll info
      const pollInfo = await confidentialVote.getPollInfo(pollid);
      console.log(`Total voters now: ${pollInfo.totalVoters.toString()}`);
      
    } catch (error) {
      console.error("Error casting vote:", error);
    }
  });

task("confidentialVote:endPoll")
  .addParam("pollid", "The ID of the poll to end", undefined, types.int)
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { pollid } = taskArguments;
    
    const signers = await ethers.getSigners();
    const confidentialVote = await ethers.getContractAt("ConfidentialVote", "0x10eF703ed9520d97A6750864c8fF3c2363132f19");
    
    try {
      const tx = await confidentialVote.connect(signers[0]).endPoll(pollid);
      const receipt = await tx.wait();
      
      console.log(`Poll ${pollid} ended successfully! Transaction hash: ${receipt.hash}`);
      
    } catch (error) {
      console.error("Error ending poll:", error);
    }
  });
