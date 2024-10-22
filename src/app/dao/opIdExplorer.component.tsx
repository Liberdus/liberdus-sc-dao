import { useEffect, useState } from 'react';
import styles from './page.module.css'
import { ethers } from 'ethers'
import { contractAddress, wagmiConfig } from '../wagmi';
import { abi } from '../../../abi.json';
import { useContractWrite, usePublicClient, useSignMessage } from 'wagmi';
import { getPublicClient } from 'wagmi/actions';
import { clientToProvider, useEthersProvider, useEthersSigner } from '../ethers';
import { operationEnumToString } from '../utils';
import { toast } from 'react-toastify';

export default function OpIdExplorer() {
  const [events, setEvents] = useState<(ethers.Log | ethers.EventLog)[]>([]);
  const provider = useEthersProvider(); 
  const [ opModal, setOpModal ] = useState(false);
  const [ modalOpId, setModalOpId ] = useState<string>("");

  const contract = new ethers.Contract(contractAddress, abi, provider);

  const queryAllEvents = async () => {
    try {

      const filter = contract.filters.OperationRequested();

      const allEvents = await contract.queryFilter(filter, 0, 'latest');


      setEvents(allEvents);

      const decoded = contract.interface.decodeEventLog("OperationRequested", allEvents[0].data, allEvents[0].topics);
      console.log(decoded);


    } catch (error) {
      console.error('Error querying events:', error);
    }
  };

  useEffect(() => {
    queryAllEvents();
  }, []);

  return (
    <div className={styles.opIdExplorerContainer}>
      {(opModal) && <DetailedOpModal isOpen={opModal} setIsOpen={setOpModal} opId={modalOpId} />}
      { 
        events.map((event, index) => {
          const decoded = contract.interface.decodeEventLog("OperationRequested", event.data, event.topics);

          return (
            <div 
              key={index} 
              className={styles.opIdExplorerEvent}
              onClick={(e)=>{
                setModalOpId(event.topics[1]);
                setOpModal(true);
              }}>
              <div className = {styles.opEntryLeft}>
                <div className={styles.eventItem}>
                  <div className={styles.eventItemLabel}>OpId: </div> <div>{event.topics[1]}</div>
                </div>
              </div>

              <div className={styles.opEntryRight}>
                <div className={styles.eventItem}><div className={styles.eventItemLabel}>Func(): </div> <div>{operationEnumToString(Number(BigInt(decoded[1]).toString()))}</div></div>
                <div className={styles.eventItem}><div className={styles.eventItemLabel}>Date: </div> <div>{(new Date(Number(BigInt(decoded[6])) * 1000)).toLocaleString()} </div></div>
              </div>
            </div>
          )
        })
      }
    </div>
  );
}


function DetailedOpModal({ isOpen, setIsOpen, opId }){
  const { signMessage, signMessageAsync } = useSignMessage({config: wagmiConfig});
  const { writeContractAsync, writeContract } = useContractWrite({config: wagmiConfig});
  const [ opDetails, setOpDetails ] = useState(null);

  const provider = useEthersProvider(); 
  const signer = useEthersSigner();

  const contract = new ethers.Contract(contractAddress, abi, provider);

  const getOperationById =  async (id: string) => {
    try {

      const op = await contract.operations(id);
      return op
    } catch (error) {
      console.error('Error querying events:', error);
    }

  };

  useEffect(() => {
    getOperationById(opId).then((op) => {
      setOpDetails(op);
      console.log(op[5]);
    })
  }, []);



  return (
    <div className={styles.detailedOpModalContainer}>
      <div className={styles.detailedOpModalContent}>
        <div className={styles.detailedOpModalHeader}>
          <h3>{opId}</h3>
        </div>
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
          <div onClick={async()=>{
            try{

            const hash = await writeContractAsync({
              address: contractAddress,
              abi: abi,
              functionName: "getOperationHash",
              args: [opId]
            })

            toast(`Operation hash: ${hash}`);

            const signature = await signMessageAsync({ message : hash });
            const sig2 = await signer?.signMessage(ethers.getBytes(hash));

            console.log("sig differs", sig2 === signature);

            toast(`Signature: ${signature}`);

            const result = await writeContractAsync({
              address: contractAddress,
              abi: abi,
              functionName: "submitSignature",
              args: [opId, signature]
            })

            toast(`Submitted Signature: ${result}`);



            }catch(e:any){
              console.error(e);
              toast(e.message);
            }

          }}>Sign</div>
          <div onClick={()=>{setIsOpen(false)}}>Close</div>
        </div>
      </div>
    </div>
  )
}

