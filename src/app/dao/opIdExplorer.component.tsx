import { useEffect, useState } from 'react';
import styles from './page.module.css'
import { ethers } from 'ethers'
import { contractAddress } from '../wagmi'; // update path
import { abi } from '../../../abi.json';
import { toast } from 'react-toastify';
import {operationEnumToString} from '../utils';

export default function OpIdExplorer() {
  const [events, setEvents] = useState<(ethers.Log | ethers.EventLog)[]>([]);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [opModal, setOpModal] = useState(false);
  const [modalOpId, setModalOpId] = useState<string>("");

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  const contract = provider ? new ethers.Contract(contractAddress, abi, provider) : null;

  const queryAllEvents = async () => {
    if (!contract) return;
    try {
      const filter = contract.filters.OperationRequested();
      const allEvents = await contract.queryFilter(filter, 0, 'latest');
      setEvents(allEvents);

    } catch (error) {
      console.error('Error querying events:', error);
    }
  };

  useEffect(() => {
    if (contract) {
      queryAllEvents();
    }
  }, [contract]);

  return (
    <div className={styles.opIdExplorerContainer}>
      {(opModal) && <DetailedOpModal
        isOpen={opModal}
        setIsOpen={setOpModal}
        opId={modalOpId}
        provider={provider}
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

function DetailedOpModal({ isOpen, setIsOpen, opId, provider }) {
  const [opDetails, setOpDetails] = useState(null);
  const [signer, setSigner] = useState(null);

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
      const contractWithSigner = contract.connect(signer);
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
      <div className={styles.detailedOpModalContent}>
        {/* ... rest of your modal JSX ... */}
        <div className={styles.detailedOpModalButtons}>
          <div onClick={handleSign}>Sign</div>
          <div onClick={() => setIsOpen(false)}>Close</div>
        </div>
      </div>
    </div>
  );
}
