import { createContext, useContext } from "react";

interface LogsContextType {
  logs: string[];
  setLogs: (logs: string) => void;
}
export const consoleTvContext = createContext<LogsContextType | undefined>(undefined);

export const useLogs = () => {
  const context = useContext(consoleTvContext);
  if (!context) {
    throw new Error('useLogs must be used within a LogsProvider');
  }
  return context;
};
