"use client"
import 'react-toastify/dist/ReactToastify.css';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import styles from './Bridge.module.css';
import {ethers} from 'ethers';
import {contractAddress, wagmiConfig, ownerAddress} from '@/app/wagmi';
import {abi} from '../../abi.json';
import {toast} from 'react-toastify';
import {useAccount} from 'wagmi';

export default function Bridge() {
  const router = useRouter();
  const {address, isConnected} = useAccount({config: wagmiConfig});

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const contract = provider ? new ethers.Contract(contractAddress, abi, provider) : null;

  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const [target, setTarget] = useState(ownerAddress);
  const [amount, setAmount] = useState("10");
  const [txId, setTxId] = useState("testTxId");
  const [bridgeType, setBridgeType] = useState("bridge_out");
  const [chainId, setChainId] = useState<number | null>(null);


  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  useEffect(() => {
    async function getChainId() {
      if (provider) {
        const network = await provider.getNetwork();
        console.log('network', network.chainId);
        setChainId(Number(network.chainId));
      }
    }

    getChainId();

    // Optional: listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (newChainId: string) => {
        setChainId(Number(newChainId));
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {
          console.log('chainChanged listener removed');
        });
      }
    };
  }, [provider]);

  const onClickBridgeInOrOut = async () => {
    try {
      if (!contract || !signer) throw new Error('Contract or signer not ready');

      const contractWithSigner = contract.connect(signer) as any;
      const bridgeAmount = ethers.parseUnits(amount, 18);
      let tx
      if (bridgeType === "bridge_in") {
        tx = await contractWithSigner.bridgeIn(target, bridgeAmount, chainId, ethers.id(txId));
      } else if (bridgeType === "bridge_out") {
        console.log("bridge out", bridgeAmount, target, chainId)
        tx = await contractWithSigner.bridgeOut(bridgeAmount, target, chainId);
      }
      if (tx == null) {
        throw new Error('Transaction not submitted');
      }

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      // Access the raw logs from the receipt
      const rawLogs = receipt.logs;

      // Parse and decode the logs using the contract interface
      const events = rawLogs
        // Filter logs emitted by your contract (optional but recommended)
        .filter(log => log.address.toLowerCase() === contractAddress.toLowerCase())
        .map(log => {
          try {
            // Parse the log to get the event object
            return contract.interface.parseLog(log);
          } catch (error) {
            // If the log is not from your contract's events, ignore it
            return null;
          }
        })
        // Remove any null entries resulting from failed parses
        .filter(event => event !== null);

      // Now you have an array of decoded events
      console.log('Decoded Events:', events);

      // You can process the events as needed
      events.forEach(event => {
        console.log(`Event ${event.name} emitted with args:`, event.args);
      });

      toast(`Submitted Signature: ${tx.hash}`);
    } catch (e: any) {
      console.error(e);
      toast(e.message);
    }
  };

  useEffect(() => {
    if (provider) {
      provider.getSigner().then(setSigner);
    }
  }, [provider]);

  // if(!operationFacts){
  //   return <div>Loading...</div>
  // }

  function onBridgeTypeChange(type: string) {
    setBridgeType(type);
    setShouldDropdown(false)
  }

  function onTargetChange(e: any) {
    setTarget(e.target.value);
  }

  function onAmountChange(e: any) {
    const amount = Number(e.target.value);
    if (typeof amount === 'number') setAmount(e.target.value);// we will later parse it to wei
  }

  function onTxIdChange(e: any) {
    const txId = e.target.value;
    setTxId(txId);
  }

  const [shouldDropdown, setShouldDropdown] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.containerBody}>
        <div className={styles.dropdown}>
          <button className={styles.dropdownButton} onClick={() => {
            setShouldDropdown(true)
          }}>{bridgeType ? bridgeType : "Select a bridge type"}</button>
          {shouldDropdown &&
            <div className={styles.dropdownContent}>
              <a href="#" onClick={() => {
                onBridgeTypeChange("bridge_out");
              }}>Liberdus token to coin (bridge out)</a>
              <a href="#" onClick={() => {
                onBridgeTypeChange("bridge_in");
              }}>Liberdus coin to token (bridge in)</a>
            </div>
          }
        </div>
        <div className={styles.textForms}>
          <input type="text" name="target" id="target" placeholder="Target address" value={target} onChange={onTargetChange}/>
        </div>
        <div className={styles.textForms}>
          <input type="text" name="amount" id="amount" placeholder="Amount" value={amount} onChange={onAmountChange}/>
        </div>
        {bridgeType === "bridge_in" && (<div className={styles.textForms}>
          <input type="text" name="target" id="target" placeholder="bridge in txId" value={txId} onChange={onTxIdChange}/>
        </div>)}
      </div>

      <div className={styles.buttonContainer}>
        <div className={styles.buttonSign} onClick={onClickBridgeInOrOut}>Submit</div>
      </div>
    </div>
  );
}
