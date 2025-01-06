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
  const [filter, setFilter] = useState<string>("all");
  const filterOptions = ["all", "active", "expired", "executed"];

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  useEffect(() => {
    if (filter === "all") {
      setFilteredEvents(events);
    }

    if (filter === "executed") {
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
        setFilteredEvents(executedEvents);
      });
    }

    if (filter === "expired") {
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
        setFilteredEvents(expiredEvents);
      });
    }

    if (filter === "active") {
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
        setFilteredEvents(activeEvents);
      });
    }
  }, [filter, events]);


  return (
    <div className={styles.opIdExplorerContainer}>
      <div className={styles.bufferZone}></div>
      <div className={styles.filters}>
        {
          filterOptions.map((option, index) => {
            return (
              <div
                key={index}
                onClick={() => { 
                  if (filter !== option){
                    setFilter(option) 
                  }
                }}
                className={styles.filterItem}
                style={
                  filter === option ? {
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

