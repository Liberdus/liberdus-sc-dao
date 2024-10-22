import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from "@rainbow-me/rainbowkit";
import styles from "./page.module.css";

export default function WalletConnect() {
  return (
    <div className={styles.banner}>
      <div>
        <h1 className={styles.title}>Liberdus Smart Contract Bridging And Governance</h1>
        <div className={styles.description}>Start Connecting your wallet to do bridge operations with liberdus network</div>
        <ConnectButton/>
      </div>
    </div>
  );
}
