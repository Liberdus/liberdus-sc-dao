import { useEffect, useRef, useState } from 'react';
import styles from './page.module.css'
import { ethers } from 'ethers'
import { contractAddress, OperationTypes,  OperationTypesMap, wagmiConfig } from '@/app/wagmi';
import { abi } from '../../../abi.json';
import { toast } from 'react-toastify';
import {operationEnumToString} from '../utils';
import Link from 'next/link';
import { BigNumberish } from 'ethers';

export default function OpIdExplorer({ events }: { events: (ethers.Log | ethers.EventLog)[] }){
  const [opModal, setOpModal] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState(events);
  const [modalOpId, setModalOpId] = useState<string>("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const contract = provider ? new ethers.Contract(contractAddress, abi, provider) : null;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const statusFilterOptions = ["all", "active", "expired", "executed"];
  const [lastMintTime, setLastMintTime] = useState<Date>(new Date());
  const [mintReady, setMintReady] = useState<boolean>(false);
  const [mintCountDown, setMintCountDown] = useState<BigInt>(BigInt(0));


  // 3 weeks + 6 days + 9 hours
  const MintInterval = BigInt(3 * 7 * 24 * 60 * 60) + BigInt(6 * 24 * 60 * 60) + BigInt(9 * 60 * 60);

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  useEffect(() => {

    const updateCountdown = () => {
      let isReady = BigInt(Math.ceil(new Date().getTime() / 1000)) - BigInt(Math.ceil(lastMintTime.getTime() / 1000)) > MintInterval; 
      setMintReady(isReady);
      if (!isReady) {
        let countdown = MintInterval - (BigInt(Math.ceil(new Date().getTime() / 1000)) - BigInt(Math.ceil(lastMintTime.getTime() / 1000)));
        setMintCountDown(countdown);
      }
    };
    updateCountdown(); // Initial call
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [lastMintTime]);

  useEffect(() => {
    if (provider) {
      const contract = new ethers.Contract(contractAddress, abi, provider);
      contract.lastMintTime().then((_lastMintTime) => {
        console.log(_lastMintTime);
        setLastMintTime(new Date((Number(_lastMintTime) * 1000)));
        
        let isReady = BigInt(Math.ceil(new Date().getTime() / 1000)) - BigInt(Math.ceil(Number(_lastMintTime) * 1000)) > MintInterval;
        setMintReady(isReady);
      });
    }
  }, [provider]);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredEvents(
        filterEventByType(events)
      );
    }

    if (statusFilter === "executed") {
      let promises = events.map(async (event) => {
        const decoded = contract?.interface.decodeEventLog(
          "OperationRequested",
          event.data,
          event.topics
        );
        const operationId = decoded[0];
        return contract?.operations(operationId);
      });

      Promise.allSettled(promises).then((p) => {
        const ops = p.map((p) => { 
          if (p.status === "fulfilled") {
            return p.value;
          }
        });

        const executedEvents = events.filter((event, index) => {
          const operation = ops[index];
          return operation[5];
        });
        setFilteredEvents(
          filterEventByType(executedEvents)
        );
      });
    }

    if (statusFilter === "expired") {
      let promises = events.map(async (event) => {
        const decoded = contract?.interface.decodeEventLog(
          "OperationRequested",
          event.data,
          event.topics
        );
        const operationId = decoded[0];
        return contract?.operations(operationId);
      });

      Promise.allSettled(promises).then((p) => {
        const ops = p.map((p) => { 
          if (p.status === "fulfilled") {
            return p.value;
          }
        });

        const expiredEvents = events.filter((event, index) => {
          const operation = ops[index];
          const deadline = new Date(Number(operation[6])* 1000);
          const expired = new Date() > deadline;
          const executed = operation[5];
          return expired && !executed;
        });
        setFilteredEvents(
          filterEventByType(expiredEvents)
        );
      });
    }

    if (statusFilter === "active") {
      let promises = events.map(async (event) => {
        const decoded = contract?.interface.decodeEventLog(
          "OperationRequested",
          event.data,
          event.topics
        );
        const operationId = decoded[0];
        return contract?.operations(operationId);
      });

      Promise.allSettled(promises).then((p) => {
        const ops = p.map((p) => { 
          if (p.status === "fulfilled") {
            return p.value;
          }
        });

        const activeEvents = events.filter((event, index) => {
          const operation = ops[index];
          const deadline = new Date(Number(operation[6])* 1000);
          const expired = new Date() > deadline;
          const executed = operation[5];
          return !expired && !executed;
        });

        setFilteredEvents(
          filterEventByType(activeEvents)
        );
      });
    }


  }, [typeFilter, statusFilter, events]);

  const filterEventByType = (e: (ethers.Log | ethers.EventLog)[]) => {
    if (typeFilter === "All") return e;
    return e.filter((event) => {
      const decoded = contract?.interface.decodeEventLog(
        "OperationRequested",
        event.data,
        event.topics
      );
      const operation = operationEnumToString(Number(decoded[1]));
      // console.log(operation, typeFilter);
      return operation === typeFilter;
    });

  }



  return (
    <div className={styles.opIdExplorerContainer}>
      <div className={styles.MintReadiness}>
        <div style={{color: mintReady ? "green" : "red"}}>
          { "Last Mint: " + lastMintTime.toLocaleString()  } - {mintReady ? "Ready" : "Not Ready"} : { mintReady ? "": formatCountdown(mintCountDown) } 
        </div>
      </div>
      <div className={styles.bufferZone}></div>
      <div className={styles.filters}>
        {
          statusFilterOptions.map((option, index) => {
            return (
              <div
                key={index}
                onClick={() => { 
                  if (statusFilter !== option){
                    setStatusFilter(option) 
                  }
                }}
                className={styles.filterItem}
                style={
                  statusFilter === option ? {
                    color: "black", 
                    opacity: 1,
                    fontWeight: 600,
                  } : {}
                }
              >
                {option} /
              </div>
            )
          })
        }
      </div>
      <div className={styles.filters}>
        {
          Object.keys(OperationFilterOptions).map((key, index) => {
            if (Number(key) || (Number(key) == 0)) return;
            return (
              <div
                key={index}
                onClick={() => { 
                  if (typeFilter !== key){
                    setTypeFilter(key) 
                  }
                }}
                className={styles.filterItem}
                style={
                  typeFilter === key ? {
                    color: "black", 
                    opacity: 1,
                    fontWeight: 600,
                  } : {}
                }
              >
                {key} /
              </div>
            )
          })
        }
      </div>
      <div className={styles.filters}>
              <div
                onClick={() => { 
                  setTypeFilter("All")
                  setStatusFilter("all")
                }}
                className={styles.filterItem}
              >
                Reset All
              </div>
      </div>
      {
        filteredEvents.map((event, index) => {
          const decoded = contract?.interface.decodeEventLog(
            "OperationRequested",
            event.data,
            event.topics
          );

          return (
            <Link
              href={`/dao/${event.topics[1].toString()}`}
              key={index}
              className={styles.opIdExplorerEvent}>
              <div className={styles.opEntryLeft}>
                <div className={styles.eventItem}>
                  <div className={styles.eventItemLabel}>OpId: </div>
                  <div>{event.topics[1]}</div>
                </div>
              </div>

              <div className={styles.opEntryRight}>
                <div className={styles.eventItem}>
                  <div className={styles.eventItemLabel}>Operation: </div>
                  <div>{operationEnumToString(Number(decoded?.[1]))}</div>
                </div>
                <div className={styles.eventItem}>
                  <div className={styles.eventItemLabel}>Date: </div>
                  <div>{new Date(Number(decoded[7]) * 1000).toLocaleString()} </div>
                </div>
              </div>
            </Link>
          )
        })
      }
    </div>
  );
}

enum OperationFilterOptions {
  All = -1,
  Mint = 0,
  Burn = 1,
  PostLaunch = 2,
  Pause = 3,
  Unpause = 4,
  SetBridgeInCaller = 5,
  SetBridgeInLimits = 6,
  UpdateSigner = 7,
  Distribute = 8,
}
  // Format countdown nicely
function formatCountdown(secondsBigInt: BigInt) {
  const seconds = Number(secondsBigInt); // Convert BigInt to Number
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;

  return new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(
    [
      days > 0 ? `${days} days` : null,
      hours > 0 ? `${hours} hours` : null,
      minutes > 0 ? `${minutes} minutes` : null,
      secs > 0 ? `${secs} seconds` : null,
    ].filter(Boolean)
  );
}

