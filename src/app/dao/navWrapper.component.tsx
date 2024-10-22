import { useAccount, useConnect, useContractWrite, useDisconnect } from "wagmi";
import styles from "./page.module.css";
import { contractAddress, wagmiConfig } from "../wagmi";
import { useState } from "react";
import { injected } from "wagmi/connectors";
import { abi } from "../../../abi.json";
import { toast } from "react-toastify";

export default function NavWrapper({ children }) {
  const { address, isConnected } = useAccount({config: wagmiConfig});
  const { disconnect } = useDisconnect();
  const [ isModal, setIsModal ] = useState(false);

  return (
    <div className={styles.navWrapper}>
      <div className={styles.navbar}>
        <div className={styles.navLeft}><h2>Liberdus Smart Contract Governance</h2></div>
        <div className={styles.navRight}>
          <div className={styles.proposal} onClick={()=>{setIsModal(true)}}>Propose</div>
          <div className={styles.address}>{ isConnected && address }</div>
          <div className={styles.disconnectBtn} onClick={(e)=>{disconnect()}}>Disconnect</div>
        </div>
      </div>
      <div className={styles.body}>
        { isModal && <ProposalModal setIsModal={setIsModal}/> }
      </div>
    </div>)
}


function ProposalModal({ setIsModal }) {
  const [ operation, setOperation ] = useState<number | null>(null);
  const [ target, setTarget ] = useState("");
  const [ scValue, setScValue ] = useState(0);
  const [ data, setData ] = useState("0x");
  const { connect } = useConnect({config: wagmiConfig});
  const { writeContractAsync, writeContract } = useContractWrite({config: wagmiConfig});
  const { address, isConnected } = useAccount({config: wagmiConfig});

  const operationEnumToString = (op: number | null) => {
    switch(op){
      case 0:
        return "Mint";
      case 1:
        return "Burn";
      case 2:
        return "PostLaunch";
      case 3:
        return "Pause";
      case 4:
        return "Unpause";
      case 5:
        return "SetBridgeInCaller";
      case 6:
        return "SetBridgeInLimits";
      case 7:
        return "UpdateSigner";
      default:
        return "Select Operation";
    }
  }

  const scRequestOperation = async () => {

      if(!isConnected){
        connect({ connector: injected() })
      }
      
      const opId = await writeContractAsync({
        address: contractAddress,
        abi: abi,
        functionName: "requestOperation",
        args: [operation, target, scValue, data],
      })
      
      if(opId){
        toast(`Operation ID: ${opId}`);
      }
      
      return opId;

  }

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
         <div className={styles.dropdown}>
            <button className={styles.dropdownButton}>{ operationEnumToString(operation) }</button>
            <div className={styles.dropdownContent}>
              <a href="#" onClick={()=>{setOperation(0)}}>Mint</a>
              <a href="#" onClick={()=>{setOperation(1)}}>Burn</a>
              <a href="#" onClick={()=>{setOperation(2)}}>PostLaunch</a>
              <a href="#" onClick={()=>{setOperation(3)}}>Pause</a>
              <a href="#" onClick={()=>{setOperation(4)}}>Unpause</a>
              <a href="#" onClick={()=>{setOperation(5)}}>SetBridgeInCaller</a>
              <a href="#" onClick={()=>{setOperation(6)}}>SetBridgeInLimits</a>
              <a href="#" onClick={()=>{setOperation(7)}}>UpdateSigner</a>
            </div>
        </div>
        <div className={styles.textForms}>
          <input type="text" name="target" id="target" placeholder="Target"
            onChange={(e: any) => {
              setTarget(e.target.value);
            }}
          />
        </div>
        <div className={styles.textForms}>
          <input type="text" name="scValue" id="scValue" placeholder="Value(0)" onChange={
            (e: any)=> { 
              const value = Number(e.target.value);
              setScValue(value);
          }}/>
        </div>
        { operation === 6 &&
          <div className={styles.textForms}>
            <input type="text" name="Data" id="Data" placeholder="Data(0x)" onChange={
              (e: any)=> { 
                setData(e.target.value);
              }
            }/>
          </div>
        }
        <div className={styles.modalButtons} onClick={async()=>{await scRequestOperation()}}>
          Request
        </div>

        <div className={styles.modalButtons} onClick={()=>{setIsModal(false)}}>
          Close 
        </div>
      </div>
    </div>
  )
}
