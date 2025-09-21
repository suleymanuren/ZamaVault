import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedConfidentialVote = await deploy("ConfidentialVote", {
    from: deployer,
    log: true,
  });

  console.log(`ConfidentialVote contract deployed at: `, deployedConfidentialVote.address);
};

export default func;
func.id = "deploy_confidentialVote";
func.tags = ["ConfidentialVote"];