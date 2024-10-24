import { useEffect, useRef, useState } from 'react';
import styles from './page.module.css'
import { ethers } from 'ethers'
import { contractAddress } from '../wagmi'; // update path
import { abi } from '../../../abi.json';
import { useContractRead, useContractWrite, usePublicClient, useSignMessage } from 'wagmi';
import { getPublicClient } from 'wagmi/actions';
import { clientToProvider, useEthersProvider, useEthersSigner } from '../ethers';
import { toast } from 'react-toastify';
import {operationEnumToString} from '../utils';
import { BrowserProvider } from 'ethers';

export default function OpIdExplorer({ events }: { events: (ethers.Log | ethers.EventLog)[] }){
  const [opModal, setOpModal] = useState(false);
  const [modalOpId, setModalOpId] = useState<string>("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const contract = provider ? new ethers.Contract(contractAddress, abi, provider) : null;

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);


  return (
    <div className={styles.opIdExplorerContainer}>
      {(opModal) && <DetailedOpModal
        setIsOpen={setOpModal}
        opId={modalOpId}
        provider={provider as ethers.BrowserProvider}
      />}
      {
        events.map((event, index) => {
          const decoded = contract?.interface.decodeEventLog(
            "OperationRequested",
            event.data,
            event.topics
          );

          return (
            <div
              key={index}
              className={styles.opIdExplorerEvent}
              onClick={()=>{
                setModalOpId(event.topics[1]);
                setOpModal(true);
              }}>
              <div className={styles.opEntryLeft}>
                <div className={styles.eventItem}>
                  <div className={styles.eventItemLabel}>OpId: </div>
                  <div>{event.topics[1]}</div>
                </div>
              </div>

              <div className={styles.opEntryRight}>
                <div className={styles.eventItem}>
                  <div className={styles.eventItemLabel}>Func(): </div>
                  <div>{operationEnumToString(Number(decoded?.[1]))}</div>
                </div>
                <div className={styles.eventItem}>
                  <div className={styles.eventItemLabel}>Date: </div>
                  <div>{new Date(Number(decoded?.[6]) * 1000).toLocaleString()} </div>
                </div>
              </div>
            </div>
          )
        })
      }
    </div>
  );
}

function DetailedOpModal({ setIsOpen, opId, provider }: {setIsOpen: any, opId: string, provider: ethers.BrowserProvider }) {
  const [opDetails, setOpDetails] = useState(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (provider) {
      provider.getSigner().then(setSigner);
    }
  }, [provider]);

  const contract = provider ? new ethers.Contract(contractAddress, abi, provider) : null;

  const getOperationById = async (id: string) => {
    if (!contract) return;
    try {
      const op = await contract.operations(id);
      console.log('Operation details:', op);
      return op;
    } catch (error) {
      console.error('Error querying events:', error);
    }
  };

  useEffect(() => {
    if (contract) {
      getOperationById(opId).then(setOpDetails);
    }
  }, [contract, opId]);
    useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false);  // Close modal if user clicks outside the modal content
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);


  const handleSign = async () => {
    try {
      if (!contract || !signer) throw new Error('Contract or signer not ready');

      // Get operation hash
      const messageHash = await contract.getOperationHash(opId);
      toast(`Operation hash: ${messageHash}`);

      // Sign the message
      const signature = await signer.signMessage(ethers.getBytes(messageHash));
      const recovered = ethers.verifyMessage(ethers.getBytes(messageHash), signature);

      console.log({
        opId,
        messageHash,
        signature,
        recovered,
        signerAddress: await signer.getAddress()
      });

      // Submit signature
      const contractWithSigner = contract.connect(signer) as any;
      const tx = await contractWithSigner.submitSignature(opId, signature);

      // Wait for transaction
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt.logs);

      toast(`Submitted Signature: ${tx.hash}`);
    } catch (e: any) {
      console.error(e);
      toast(e.message);
    }
  };

  return (
    <div className={styles.detailedOpModalContainer}>
      <div className={styles.detailedOpModalContent} ref={modalRef}>
        {/* ... rest of your modal JSX ... */}
        <h3>{opId}</h3>
        <table className={styles.opTable}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Target</th>
              <th>Value</th>
              <th>Data</th>
              <th>Executed</th>
              <th>SigCount</th>
            </tr>
          </thead>
          { opDetails &&
            <tbody>
                <tr >
                  <td>{BigInt(opDetails[0]).toString()}</td>
                  <td>{opDetails[1]}</td>
                  <td>{BigInt(opDetails[2]).toString()}</td>
                  <td>{opDetails[3]}</td>
                  <td>{opDetails[5] ? "true" : "false" }</td>
                  <td>{BigInt(opDetails[4]).toString()}</td>
                </tr>
            </tbody>
          }
        </table>
        <div className={styles.detailedOpModalButtons}>
          <div onClick={handleSign}>Sign</div>
          <div onClick={() => setIsOpen(false)}>Close</div>
        </div>
      </div>
    </div>
  );
}
