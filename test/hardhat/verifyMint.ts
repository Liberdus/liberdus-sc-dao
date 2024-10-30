import { contractAddress, ownerAddress } from "../../src/app/wagmi";
import { ethers } from "ethers";
import { abi } from "../../abi.json";

// query ERC20 Balance for specific address
export async function getBalance(address: string) {
  const provider = new ethers.JsonRpcProvider("http://0.0.0.0:8545/");
  const contract = new ethers.Contract(
    contractAddress,
    abi,
    provider
  );

  const balance = await contract.balanceOf(address);
  return balance;
}


const main = async () => {
    const balance = await getBalance(ownerAddress);
    console.log(ownerAddress, balance.toString());
    console.log("isPostLaunch", await getIsPostLaunch());
    console.log("BridgeInCaller", await getBridgeInCaller());
    console.log("BridgeInLimits", await getBridgeInLimits());
    console.log("isPaused", await isPaused());
}

export async function getIsPostLaunch() {
  const provider = new ethers.JsonRpcProvider("http://0.0.0.0:8545/");
  const contract = new ethers.Contract(
    contractAddress,
    abi,
    provider
  );

  return !(await contract.isPreLaunch())

}

export async function getBridgeInCaller() {
  const provider = new ethers.JsonRpcProvider("http://0.0.0.0:8545/");
  const contract = new ethers.Contract(
    contractAddress,
    abi,
    provider
  );
  return await contract.bridgeInCaller();
}

export async function getBridgeInLimits() {
  const provider = new ethers.JsonRpcProvider("http://0.0.0.0:8545/");
  const contract = new ethers.Contract(
    contractAddress,
    abi,
    provider
  );
  return { cooldown: await contract.bridgeInCooldown(), max: await contract.maxBridgeInAmount() };
}

export async function isPaused() {
  const provider = new ethers.JsonRpcProvider("http://0.0.0.0:8545/");
  const contract = new ethers.Contract(
    contractAddress,
    abi,
    provider
  );
  return (await contract.paused());
}

main();
