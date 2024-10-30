import {useAccount, useConnect, useContractWrite, useDisconnect, useContractRead} from "wagmi";
import styles from "./page.module.css";
import {contractAddress, wagmiConfig, OperationTypes, defaultLiberdusValues} from "../wagmi";
import { useEffect, useRef, useState } from "react";
import { injected } from "wagmi/connectors";
import { abi } from "../../../abi.json";
import { toast } from "react-toastify";
import { operationEnumToString } from "../utils";

function useContractOwner() {
  const contractConfig = {
    address: contractAddress,
    abi: abi,
  };
  const {data: owner, isLoading, isError} = useContractRead({
    ...contractConfig,
    functionName: 'owner',
  });

  return owner
}

export default function NavWrapper({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount({config: wagmiConfig});
  const { disconnect } = useDisconnect();
  const [ isModal, setIsModal ] = useState(false);
  const navBarRef = useRef<any>(null);
  const [ offsetBody, setOffsetBody ] = useState(0);

  const owner = useContractOwner();
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
        {isModal && <ProposalModal setIsModal={setIsModal} owner={owner}/>}
        { children }
      </div>
    </div>)
}

function ProposalModal({setIsModal, owner}: { setIsModal: (x: boolean) => void, owner: string }) {
  const modalRef = useRef<any>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [ target, setTarget ] = useState("");
  const [ scValue, setScValue ] = useState("");
  const [ data, setData ] = useState("0x");
  const { connect } = useConnect({config: wagmiConfig});
  const { writeContractAsync, writeContract } = useContractWrite({config: wagmiConfig});
  const { address, isConnected } = useAccount({config: wagmiConfig});

  function resetModal() {
    setTarget("");
    setScValue("");
  }

  function onOperationTypeChange(value) {
    resetModal();
    setOperation(value);
    setShouldDropdown(false)
  }

  function onTargetChange(e: any) {
    const target = e.target.value;
    setTarget(e.target.value);
  }

  function onValueChange(e: any) {
    const value = Number(e.target.value);
    setScValue(value)
  }

  function onDataChange(e: any) {
    setData(e.target.value);
  }

  function getPlaceHolder(inputField: string) {
    if (operation == null) {
      return {
        placeholder: "",
        disabled: true,
        default: ""
      }
    }
    return {
      // @ts-ignore
      placeholder: defaultLiberdusValues[operation][inputField]["placeholder"],
      // @ts-ignore
      disabled: defaultLiberdusValues[operation][inputField]["allowed"] === false,
      // @ts-ignore
      default: defaultLiberdusValues[operation][inputField]["default"]
    };
  }

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
           <button className={styles.dropdownButton} onClick={() => {
             setShouldDropdown(true)
           }}>{operation ? operation : "Select an operation to request"}</button>
            { shouldDropdown &&
              <div className={styles.dropdownContent}>
                <a href="#" onClick={() => {
                  onOperationTypeChange(OperationTypes.Mint);
                }}>Mint</a>
                <a href="#" onClick={() => {
                  onOperationTypeChange(OperationTypes.Burn);
                }}>Burn</a>
                <a href="#" onClick={() => {
                  onOperationTypeChange(OperationTypes.PostLaunch);
                }}>PostLaunch</a>
                <a href="#" onClick={() => {
                  onOperationTypeChange(OperationTypes.Pause);
                }}>Pause</a>
                <a href="#" onClick={() => {
                  onOperationTypeChange(OperationTypes.Unpause);
                }}>Unpause</a>
                <a href="#" onClick={() => {
                  onOperationTypeChange(OperationTypes.SetBridgeInCaller);
                }}>SetBridgeInCaller</a>
                <a href="#" onClick={() => {
                  onOperationTypeChange(OperationTypes.SetBridgeInLimits);
                }}>SetBridgeInLimits</a>
                <a href="#" onClick={() => {
                  onOperationTypeChange(OperationTypes.UpdateSigner);
                }}>UpdateSigner</a>
              </div>
            }
        </div>
        <div className={styles.textForms}>
          <input type="text" name="target" id="target" placeholder={getPlaceHolder("target").placeholder} value={target ? target : getPlaceHolder("target").default}
                 onChange={onTargetChange} disabled={getPlaceHolder("target").disabled} style={{display: getPlaceHolder("target").disabled ? 'none' : 'block'}}
          />
        </div>
        <div className={styles.textForms}>
          <input type="text" name="scValue" id="scValue" placeholder={getPlaceHolder("value").placeholder} value={scValue ? scValue : getPlaceHolder("value").default} onChange={onValueChange} disabled={getPlaceHolder("value").disabled} style={{display: getPlaceHolder("value").disabled ? 'none' : 'block'}}/>
        </div>
          <div className={styles.textForms}>
            <input type="text" name="Data" id="Data" placeholder={getPlaceHolder("data").placeholder} disabled={getPlaceHolder("data").disabled} onChange={onDataChange} style={{display: getPlaceHolder("data").disabled ? 'none' : 'block'}}/>
          </div>
        <button className={styles.modalButtons} onClick={async()=>{await scRequestOperation()}} disabled={operation == null}>
          Request Operation
        </button>

        <button className={styles.modalButtons} onClick={()=>{setIsModal(false)}}>
          Close
        </button>
      </div>
    </div>
  )
}
