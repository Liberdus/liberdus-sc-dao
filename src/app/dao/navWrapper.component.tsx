import { useAccount, useConnect, useContractWrite, useDisconnect } from "wagmi";
import styles from "./page.module.css";
import { contractAddress, wagmiConfig } from "../wagmi";
import { useEffect, useRef, useState } from "react";
import { injected } from "wagmi/connectors";
import { abi } from "../../../abi.json";
import { toast } from "react-toastify";
import { operationEnumToString } from "../utils";

export default function NavWrapper({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount({config: wagmiConfig});
  const { disconnect } = useDisconnect();
  const [ isModal, setIsModal ] = useState(false);
  const navBarRef = useRef<any>(null);
  const [ offsetBody, setOffsetBody ] = useState(0);

  useEffect(() => {
    setOffsetBody(navBarRef?.current?.offsetHeight || 0);
  }, [navBarRef]);
  

  return (
    <div className={styles.navWrapper}>
      <div className={styles.navbar} ref={navBarRef}>
        <div className={styles.navLeft}><h2>Liberdus Smart Contract Governance</h2></div>
        <div className={styles.navRight}>
          <div className={styles.proposal} onClick={()=>{setIsModal(true)}}>Propose</div>
          <div className={styles.address}>{ isConnected && address }</div>
          <div className={styles.disconnectBtn} onClick={(e)=>{disconnect()}}>Disconnect</div>
        </div>
      </div>
      <div className={styles.navInner}>
        <div style={{height: offsetBody}}></div>
        { isModal && <ProposalModal setIsModal={setIsModal}/> }
        { children }
      </div>
    </div>)
}



function ProposalModal({ setIsModal }: { setIsModal: (x: boolean)=>void }) {
  const modalRef = useRef<any>(null);
  const [ operation, setOperation ] = useState<number | null>(null);
  const [ target, setTarget ] = useState("");
  const [ scValue, setScValue ] = useState(0);
  const [ data, setData ] = useState("0x");
  const { connect } = useConnect({config: wagmiConfig});
  const { writeContractAsync, writeContract } = useContractWrite({config: wagmiConfig});
  const { address, isConnected } = useAccount({config: wagmiConfig});

  const scRequestOperation = async () => {

      if(!isConnected){
        connect({ connector: injected() })
      }
      
      let opId = null
      try{
         opId = await writeContractAsync({
          address: contractAddress,
          abi: abi,
          functionName: "requestOperation",
          args: [operation, target, scValue, data],
        })
      }catch(e: any){
        toast(e.message);
      }
      
      if(opId){
        toast(`Operation ID: ${opId}`);
      }
      else{
        toast("Failed to request operation");
      }
      
      return opId;

  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModal(false);  // Close modal if user clicks outside the modal content
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsModal]);

  const [ shouldDropdown, setShouldDropdown ] = useState(false);

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent} ref={modalRef}>
         <div className={styles.dropdown}>
            <button className={styles.dropdownButton} onClick={()=>{setShouldDropdown(true)}}>{ operationEnumToString(operation) }</button>
            { shouldDropdown &&
              <div className={styles.dropdownContent}>
                <a href="#" onClick={()=>{setOperation(0); setShouldDropdown(false) }}>Mint</a>
                <a href="#" onClick={()=>{setOperation(1); setShouldDropdown(false) }}>Burn</a>
                <a href="#" onClick={()=>{setOperation(2); setShouldDropdown(false) }}>PostLaunch</a>
                <a href="#" onClick={()=>{setOperation(3); setShouldDropdown(false) }}>Pause</a>
                <a href="#" onClick={()=>{setOperation(4); setShouldDropdown(false) }}>Unpause</a>
                <a href="#" onClick={()=>{setOperation(5); setShouldDropdown(false) }}>SetBridgeInCaller</a>
                <a href="#" onClick={()=>{setOperation(6); setShouldDropdown(false) }}>SetBridgeInLimits</a>
                <a href="#" onClick={()=>{setOperation(7); setShouldDropdown(false) }}>UpdateSigner</a>
              </div>

            }
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
