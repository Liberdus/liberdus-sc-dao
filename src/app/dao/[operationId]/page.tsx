"use client"
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { ethers } from 'ethers';
import { contractAddress, OperationTypes,  OperationTypesMap, wagmiConfig } from '@/app/wagmi';
import { abi } from '../../../../abi.json';
import { operationEnumToString } from '@/app/utils';
import { toast } from 'react-toastify';
import { useAccount } from 'wagmi';
import { BigNumberish } from 'ethers';

export default function ProposalDetails({params}: { params: { operationId: string }}){
  const router = useRouter();
  const { address, isConnected } = useAccount({config: wagmiConfig});

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const contract = provider ? new ethers.Contract(contractAddress, abi, provider) : null;

  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  type OperationFacts = {
    type: number,
    target: string,
    value: bigint | string | number,
    data: string,
    signed: number,
    sigRequired: number,
    approvers: string[],
    executed: boolean
    proposer: string,
    proposedTimestamp: number
    
  }
  const [ operationFacts, setOperationFacts ] = useState<OperationFacts | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  const getOperationFactsById = async (id: string): Promise<OperationFacts> => {
      const basicOperationFacts = await contract?.operations(id);

      console.log(basicOperationFacts);

      const completeOperationFacts: OperationFacts = {
        type: Number(BigInt(basicOperationFacts[0])),
        target: basicOperationFacts[1].toString(),
        value: BigInt(basicOperationFacts[2]),
        data: basicOperationFacts[3].toString(),
        signed: Number(BigInt(basicOperationFacts[4])),
        executed: basicOperationFacts[5],
        proposer: "" ,
        proposedTimestamp: Date.now(),
        approvers: [],
        sigRequired: 3, 
      }
      if (basicOperationFacts[0] == OperationTypesMap[OperationTypes.UpdateSigner]) {
        completeOperationFacts.sigRequired = 2
        completeOperationFacts.value = ethers.getAddress(ethers.toBeHex(completeOperationFacts.value as BigNumberish, 20));
      }


    const logs = await contract?.queryFilter("OperationRequested", 0, 'latest');

    const events = logs?.map((log:any) => contract?.interface.parseLog(log));

    console.log(events);
    if(!events) return completeOperationFacts;

    for (const event of events) {
      if(event?.args[0].toString() == params.operationId){
        completeOperationFacts.proposer = event.args[2].toString();
        completeOperationFacts.proposedTimestamp = new Date(Number(BigInt(event.args[6]))*1000).getTime();
        break;
      }
    }

    const signature_logs = await contract?.queryFilter("SignatureSubmitted", 0, 'latest');
    const signature_events = signature_logs?.map((log:any) => contract?.interface.parseLog(log));

    if(!signature_events) return completeOperationFacts;

    for (const event of signature_events) {
      if(event?.args[0].toString() == params.operationId){
        console.log(event);
        completeOperationFacts.approvers.push(event.args[1].toString());
        completeOperationFacts.sigRequired = Number(BigInt(event.args[3]));
      }
    }


    return completeOperationFacts;
  };

  const handleSign = async () => {
    try {
      if (!contract || !signer) throw new Error('Contract or signer not ready');

      const messageHash = await contract.getOperationHash(params.operationId);
      toast(`Operation hash: ${messageHash}`);

      const signature = await signer.signMessage(ethers.getBytes(messageHash));

      const contractWithSigner = contract.connect(signer) as any;
      const tx = await contractWithSigner.submitSignature(params.operationId, signature);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      // Access the raw logs from the receipt
      const rawLogs = receipt.logs;

      // Parse and decode the logs using the contract interface
      const events = rawLogs
        // Filter logs emitted by your contract (optional but recommended)
        .filter((log:any) => log.address.toLowerCase() === contractAddress.toLowerCase())
        .map((log:any) => {
          try {
            // Parse the log to get the event object
            return contract.interface.parseLog(log);
          } catch (error) {
            // If the log is not from your contract's events, ignore it
            return null;
          }
        })
        // Remove any null entries resulting from failed parses
        .filter((event:any)=> event !== null);

      // Now you have an array of decoded events
      console.log('Decoded Events:', events);

      // You can process the events as needed
      events.forEach((event:any) => {
        console.log(`Event ${event.name} emitted with args:`, event.args);
      });

      // Continue with your existing logic
      getOperationFactsById(params.operationId).then(setOperationFacts);

      toast(`Submitted Signature: ${tx.hash}`);
    } catch (e: any) {
      console.error(e);
      toast(e.message);
    }
  };

  useEffect(() => {
    if(operationFacts === null && contract){
      getOperationFactsById(params.operationId).then(setOperationFacts);
    }
  },[contract])

  useEffect(() => {
    if (provider) {
      provider.getSigner().then(setSigner);
    }
  }, [provider]);

  if(!operationFacts){
    return <div>Loading...</div>
  }

  function getDecodedData(operationFacts: OperationFacts) {
    console.log('operationFacts', operationFacts);
    if (operationFacts.type === OperationTypesMap[OperationTypes.SetBridgeInLimits]) {
      console.log('operationFacts.data', operationFacts.data);
      const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(
        ['uint256'],
        ethers.getBytes(operationFacts.data)
      );
      console.log('decodedData', decodedData.toString());
      return decodedData.toString();
    }
  }

  function weiToEth(wei: BigNumberish) {
    return ethers.formatEther(wei);
  }

  return (
    <div className={styles.container}>
      <div className={styles.containerBody}>
        <div className={styles.keys}>
          <div className={styles.key}>Operation:</div>
          <div className={styles.key}>Target:</div>
          <div className={styles.key}>Value:</div>
          <div className={styles.key}>Data:</div>
          <div className={styles.key}>Signatures:</div>
          <div className={styles.key}>Executed:</div>
          <div className={styles.key}>Proposed By:</div>
          <div className={styles.key}>Proposed Date:</div>
        </div>
        <div className={styles.values}>
          <div className={styles.value}>{operationEnumToString(operationFacts.type)}</div>
          <div className={styles.value}>{operationFacts.target}</div>
          <div className={styles.value}>{ 
            (operationFacts.type == 1 || operationFacts.type == 8) ? `${weiToEth(operationFacts.value as BigNumberish)} LBD`:
            operationFacts.value.toString()
          }</div>
          <div className={styles.value}>{getDecodedData(operationFacts)}</div>
          <div className={styles.value}>{operationFacts.signed.toString()}/{operationFacts.sigRequired.toString()}</div>
          <div className={styles.value}>{operationFacts.executed ? "True" : "False"}</div>
          <div className={styles.value}>{operationFacts.proposer}</div>
          <div className={styles.value}>{new Date(operationFacts.proposedTimestamp).toLocaleString()}</div>
        </div>
      </div>

      <div className={styles.buttonContainer}>
        <div className={styles.buttonBack} onClick={() => router?.push('/dao')}>Back</div>
        { isConnected && !operationFacts.approvers.includes(address as string) && !operationFacts.executed &&
          <div className={styles.buttonSign} onClick={handleSign}>Sign</div>
        }
      </div>
    </div>
  );
}

