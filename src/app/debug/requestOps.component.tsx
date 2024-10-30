"use client"

import styles from "./debug.module.css";
import { useAccount, useConnect, useContractWrite, useSignMessage } from 'wagmi';

import abi from "../../../abi.json"
import { useState } from "react";
import { contractAddress, wagmiConfig } from "../wagmi";
import { injected } from "wagmi/connectors";
import ExecuteOperation from "./execOps.component";
import { useLogs } from "./consoleTv.context";



export default function OperationDashboard() {
  const { logs, setLogs } = useLogs();

  const { address, isConnected } = useAccount({config: wagmiConfig});
  const { writeContractAsync, writeContract } = useContractWrite({config: wagmiConfig});
  const [ target, setTarget ] = useState("");
  const [ operation, setOperation ] = useState<null | number>(null);
  const [ scValue, setScValue ] = useState(0);
  const [ data, setData ] = useState("");
  const { connect } = useConnect({config: wagmiConfig});


  return (
    <div className={styles.ops}>
        <h1 className={styles.opstitle}>Request Operation</h1>
          <div className={styles.opsForms}>
            <div>Operation Type </div>
            <div> 
            <input type="text" name="operation" id="operation" 
            onChange={(e: any) => {
              const value = Number(e.target.value);

              // Check if the value is a number and within the valid range
              if (isNaN(value) || value < 0 || value > 8) {
                e.target.value = ""; // Reset the input if it's out of range or not a number
                setOperation(null);
              }

              setOperation(value);
            }}/></div>
          </div>
          <div className={styles.opsForms}>
            <div>Target</div> 
            <div>
              <input 
                type="text" name="target" id="target"
                onChange={(e: any) => {
                  setTarget(e.target.value);
                }}
              />
            </div>
          </div>
          <div className={styles.opsForms}>
            <div>Value</div> 
            <div> 
              <input type="text" name="scValue" id="scValue"
              onChange={(e: any)=> { 
              const value = Number(e.target.value);

              setScValue(value);
  }}/>
            </div>
          </div>
          <div className={styles.opsForms}>
            <div>Data</div> 
            <div> <input type="text" name="data" id="data" onChange={(e:any)=>{setData(e.target.value)}}/></div>
          </div>
          <div className={styles.opsForms}>
            <button onClick={async ()=>{

              if(!isConnected){
                setLogs("Please connect your wallet with appropirate chain");
                connect({ connector: injected() })
              }

              if(operation === null || target === "" || data === ""){
                setLogs("Invalid Params");
                return;
              }

              const opId = await writeContractAsync({
                address: contractAddress,
                abi: abi,
                functionName: "requestOperation",
                args: [operation, target, scValue, data],
              })

              setLogs(`Operation Requestion Successful: ${opId}`);


            }}>Request</button>
          </div>
          <ExecuteOperation/>
    </div>
  );
}
