import { expect } from "chai";
import { ethers } from "hardhat";

describe("ConfidentialVote", function () {
  it("Should deploy successfully", async function () {
    const ConfidentialVote = await ethers.getContractFactory("ConfidentialVote");
    const confidentialVote = await ConfidentialVote.deploy();
    
    expect(await confidentialVote.getTotalPolls()).to.equal(0);
  });

  it("Should create a poll", async function () {
    const ConfidentialVote = await ethers.getContractFactory("ConfidentialVote");
    const confidentialVote = await ConfidentialVote.deploy();
    
    const title = "Test Poll";
    const options = ["Option 1", "Option 2"];
    const duration = 24;
    
    await confidentialVote.createPoll(title, options, duration);
    
    expect(await confidentialVote.getTotalPolls()).to.equal(1);
    
    const pollInfo = await confidentialVote.getPollInfo(0);
    expect(pollInfo[0]).to.equal(title);
    expect(pollInfo[1]).to.deep.equal(options);
  });
});
