import {useAccount, useConnect, useContractWrite, useDisconnect, useContractRead} from "wagmi";
import styles from "./page.module.css";
import {contractAddress, wagmiConfig, OperationTypes, defaultLiberdusValues, OperationTypesMap, ownerAddress} from "../wagmi";
import { useEffect, useRef, useState } from "react";
import { injected } from "wagmi/connectors";
import { abi } from "../../../abi.json";
import { toast } from "react-toastify";
import { operationEnumToString } from "../utils";
import {zeroAddress} from "ethers";
import {ethers} from "ethers";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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
          <div className={styles.proposal} onClick={()=>{router.push("/dao")}}>Proposals</div>
          <div className={styles.proposal} onClick={()=>{router.push("/")}}>Bridging</div>
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
  const [ target, setTarget ] = useState(ownerAddress);
  const [ scValue, setScValue ] = useState<any>(0);
  const [ data, setData ] = useState("0x");
  const { connect } = useConnect({config: wagmiConfig});
  const { writeContractAsync, writeContract } = useContractWrite({config: wagmiConfig});
  const { address, isConnected } = useAccount({config: wagmiConfig});

  function resetModal() {
    setTarget("");
    setScValue(0);
  }

  function onOperationTypeChange(type) {
    resetModal();
    setOperation(type);
    setShouldDropdown(false)
    if (type === OperationTypes.Mint) {
      setTarget(contractAddress);
      setScValue(3000000);
    }
    if (type === OperationTypes.Pause || type === OperationTypes.Unpause) {
      setTarget(ownerAddress);
    }
  }

  function onTargetChange(e: any) {
    const target = e.target.value;
    setTarget(e.target.value);
  }

  function onValueChange(e: any) {
    console.log('operation', operation);
    if (operation === OperationTypes.UpdateSigner) {
      setScValue(e.target.value);
      return
    }
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
    if (target === "") {
      setTarget(ownerAddress);
    }
    console.log('target', target);

    if (operation === OperationTypes.SetBridgeInLimits) {
      const newMaxAmount = ethers.parseUnits("20000", 18);  // 20,000 tokens
      const newCooldown = BigInt(data);  // cooldown in seconds
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256'],
        [newCooldown]
      );
      console.log('encodedData', encodedData);
      setData(encodedData);
      // setScValue(newMaxAmount);
    }

    let finalValue = scValue
    if (operation === OperationTypes.UpdateSigner) {
      finalValue = BigInt(scValue)
    }
    if (operation === OperationTypes.Distribute) {
      const amountInWei = ethers.parseUnits(String(scValue), 18);
      finalValue = amountInWei;
    }
    if (operation === OperationTypes.Burn) {
      const amountInWei = ethers.parseUnits(String(scValue), 18);
      finalValue = amountInWei;
    }
    console.log(operation, OperationTypesMap[operation], target, finalValue, data);
      try{
         opId = await writeContractAsync({
          address: contractAddress,
          abi: abi,
          functionName: "requestOperation",
          args: [OperationTypesMap[operation], target, finalValue, data],
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
                  onOperationTypeChange(OperationTypes.Distribute);
                }}>Distribute</a>
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
          <input type="text" name="target" id="target" placeholder={getPlaceHolder("target").placeholder} value={target}
                 onChange={onTargetChange} disabled={getPlaceHolder("target").disabled} style={{display: getPlaceHolder("target").disabled ? 'none' : 'block'}}
          />
        </div>
        <div className={styles.textForms}>
          <input type="text" name="scValue" id="scValue" placeholder={getPlaceHolder("value").placeholder} value={scValue} onChange={onValueChange} disabled={getPlaceHolder("value").disabled} style={{display: getPlaceHolder("value").disabled ? 'none' : 'block'}}/>
          <div className={styles.ethWei}>{ }</div>
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
