import { createContext, useContext, useState, ReactNode } from "react";

type DeepLinkContextType = {
  isDeepLinkChecked: boolean;
  setIsDeepLinkChecked: (value: boolean) => void;
  isRecoveryMode: boolean;
  setIsRecoveryMode: (value: boolean) => void;
};

const DeepLinkContext = createContext<DeepLinkContextType | undefined>(
  undefined
);

export const DeepLinkProvider = ({ children }: { children: ReactNode }) => {
  const [isDeepLinkChecked, setIsDeepLinkChecked] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  return (
    <DeepLinkContext.Provider
      value={{
        isDeepLinkChecked,
        setIsDeepLinkChecked,
        isRecoveryMode,
        setIsRecoveryMode,
      }}
    >
      {children}
    </DeepLinkContext.Provider>
  );
};

export const useDeepLink = () => {
  const context = useContext(DeepLinkContext);
  if (!context) {
    throw new Error("useDeepLink must be used within a DeepLinkProvider");
  }
  return context;
};
