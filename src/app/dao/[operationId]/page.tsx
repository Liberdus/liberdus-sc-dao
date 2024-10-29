"use client"
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { ethers } from 'ethers';
import { contractAddress, wagmiConfig } from '@/app/wagmi';
import { abi } from '../../../../abi.json';
import { operationEnumToString } from '@/app/utils';
import { toast } from 'react-toastify';
import { useAccount } from 'wagmi';

export default function ProposalDetails({params}: { params: { operationId: string }}){
  const router = useRouter();
  const { address, isConnected } = useAccount({config: wagmiConfig});

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const contract = provider ? new ethers.Contract(contractAddress, abi, provider) : null;

  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  type OperationFacts = {
    type: number,
    target: string,
    value: BigInt,
    data: string,
    signed: Number,
    sigRequired: Number,
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

      let completeOperationFacts: OperationFacts = {
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
      // const recovered = ethers.verifyMessage(ethers.getBytes(messageHash), signature);

      const contractWithSigner = contract.connect(signer) as any;
      const tx = await contractWithSigner.submitSignature(params.operationId, signature);

      // const receipt = await tx.wait();

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

  return (
    <div className={styles.container}>
      <div className={styles.containerBody}>
        <div className={styles.keys}>
          <div className={styles.key}>Func():</div>
          <div className={styles.key}>Target:</div>
          <div className={styles.key}>Value:</div>
          <div className={styles.key}>Data:</div>
          <div className={styles.key}>Signed:</div>
          <div className={styles.key}>Executed:</div>
          <div className={styles.key}>ProposedBy:</div>
          <div className={styles.key}>Proposed Date:</div>
        </div>
        <div className={styles.values}>
          <div className={styles.value}>{operationEnumToString(operationFacts.type)}</div>
          <div className={styles.value}>{operationFacts.target}</div>
          <div className={styles.value}>{operationFacts.value.toString()}</div>
          <div className={styles.value}>{operationFacts.data}</div>
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
