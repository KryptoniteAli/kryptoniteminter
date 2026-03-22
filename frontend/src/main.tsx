import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  IotaClientProvider,
  WalletProvider,
} from "@iota/dapp-kit";
import "@iota/dapp-kit/dist/index.css";
import App from "./App";

const queryClient = new QueryClient();

const networks = {
  mainnet: {
    url: "https://api.mainnet.iota.cafe",
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <IotaClientProvider networks={networks} defaultNetwork="mainnet">
        <WalletProvider autoConnect>
          <App />
        </WalletProvider>
      </IotaClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
