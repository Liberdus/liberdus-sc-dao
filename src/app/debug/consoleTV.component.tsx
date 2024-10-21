
import { useEffect, useState } from "react";
import styles from "./debug.module.css";
import { useLogs } from "./consoleTv.context";

export default function ConsoleTV() {
  const { logs } = useLogs();

  return (
    <div className={styles.console}>
      {logs.map((log, index) => {
        return <div key={index}>{log}<br/></div>
      })} 

    </div>
  );
}

