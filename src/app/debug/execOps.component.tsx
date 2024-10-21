"use client"

import styles from "./debug.module.css";
import { useAccount, useConnect, useContractWrite, useSignMessage, useWatchContractEvent } from 'wagmi';

import abi from "../../../abi.json"
import { useState } from "react";
import { contractAddress, wagmiConfig } from "../wagmi";
import { useLogs } from "./consoleTv.context";


export default function ExecuteOperation() {
  const { logs, setLogs } = useLogs(); 

  const { address, isConnected } = useAccount({config: wagmiConfig});
  const { writeContractAsync, writeContract } = useContractWrite({config: wagmiConfig});
  const [ opId, setOpId ] = useState("");
  const { connect } = useConnect({config: wagmiConfig});
  const { signMessage } = useSignMessage({config: wagmiConfig});



  return (
    <div className={styles.execOps}>
      <h1>Execute Operations</h1>
        <div className={styles.opsForms}>
          <div>Operation Type </div>
          <div> 
          <input type="text" name="operation" id="operation" 
          onChange={(e: any) => {
            const value = e.target.value
            setOpId(value);
          }}/></div>
        </div>
        <div className={styles.opsForms}>
          <button onClick={async(e)=>{

              setLogs(`Attempting to execute operation: ${opId}`);

              let hash = null
              if(opId){
                setLogs(`Attempting to gain hash for operation: ${opId}`);
                hash = await writeContractAsync({
                  address: contractAddress,
                  abi: abi,
                  functionName: "getOperationHash",
                  args: [opId]
                })

                setLogs(`Operation hash: ${hash}`);
              }

              
              if(hash){
                const sig = signMessage({message: hash})

                setLogs(`Submitting Signature for op id: ${opId}`);
                writeContract({
                  address: contractAddress,
                  abi: abi,
                  functionName: "submitSignature",
                  args: [opId, sig]
                })

              }

          }}>Execute</button>
        </div>
    </div>
  );
}

