// @ts-nocheck
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  Transaction, 
  SystemProgram 
} from "@solana/web3.js";
import { 
  Wallet, 
  Terminal, 
  Coins, 
  ExternalLink,
  ShieldAlert,
  Fingerprint,
  RefreshCw,
  Send
} from "lucide-react";

interface SolanaWalletAdapterProps {
  onAddTransaction?: (tx: { id: string; type: "purchase" | "sale" | "mining" | "listing"; title: string; amount: number; timestamp: string }) => void;
  accentColor: string;
}

export const SolanaWalletAdapter: React.FC<SolanaWalletAdapterProps> = ({ 
  onAddTransaction,
  accentColor 
}) => {
  // Connection states
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<"phantom" | "solflare" | "injected" | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [network, setNetwork] = useState<"mainnet-beta" | "devnet" | "testnet">("devnet");
  const [rpcUrl, setRpcUrl] = useState("https://api.devnet.solana.com");
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Signer / Sandbox Interactive Playbook State
  const [signMessageText, setSignMessageText] = useState("[S.O.U.L Genesis] Authenticate hardware lease for autonomous agent neural core #0492");
  const [signatureOutput, setSignatureOutput] = useState<string | null>(null);
  const [isSigningMessage, setIsSigningMessage] = useState(false);

  // Transfer state
  const [transferDest, setTransferDest] = useState("");
  const [transferAmount, setTransferAmount] = useState("0.001");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Status logs
  const [web3Logs, setWeb3Logs] = useState<string[]>([
    "Initialize Decentralized Web3 Web-Provider Stack...",
  ]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setWeb3Logs((prev) => [`[${timestamp}] ${msg}`, ...prev].slice(0, 15));
  };

  // Sync RPC URL based on network selection
  useEffect(() => {
    let url = "https://api.devnet.solana.com";
    if (network === "mainnet-beta") {
      // Allow getting from vault or fall back
      const savedVault = localStorage.getItem("agent_workbench_vault_keys");
      if (savedVault) {
        try {
          const keys = JSON.parse(savedVault);
          if (keys.SOLANA_RPC_URL && keys.SOLANA_RPC_URL.trim() !== "") {
            url = keys.SOLANA_RPC_URL;
          } else {
            url = "https://api.mainnet-beta.solana.com";
          }
        } catch {
          url = "https://api.mainnet-beta.solana.com";
        }
      } else {
        url = "https://api.mainnet-beta.solana.com";
      }
    } else if (network === "testnet") {
      url = "https://api.testnet.solana.com";
    }
    setRpcUrl(url);
    addLog(`Target Solana network configuration switched to: ${network.toUpperCase()}`);
  }, [network]);

  // Fetch balance from chain
  const fetchBalance = async (address: string) => {
    if (!address) return;
    setIsFetchingBalance(true);
    setConnectionError(null);
    try {
      addLog(`Querying standard block index via endpoint: ${rpcUrl}`);
      const connection = new Connection(rpcUrl, "confirmed");
      const pubkey = new PublicKey(address);
      const balanceLamports = await connection.getBalance(pubkey);
      const computedSol = balanceLamports / LAMPORTS_PER_SOL;
      setSolBalance(computedSol);
      addLog(`Successfully matched blockchain account ledger details! Balance is: ${computedSol} SOL`);
    } catch (err: any) {
      console.error("Failed to query Solana RPC:", err);
      // Try to gracefully fall back
      try {
        addLog(`Direct RPC Node queried offline, attempting quick devnet public gateway fallback...`);
        const fallbackConnection = new Connection("https://api.devnet.solana.com", "confirmed");
        const balanceLamports = await fallbackConnection.getBalance(new PublicKey(address));
        setSolBalance(balanceLamports / LAMPORTS_PER_SOL);
        addLog(`Stat fetched from public devnet successfully.`);
      } catch (fallbackErr: any) {
        setConnectionError(`RPC Query Failed: ${err.message}`);
        setSolBalance(null);
        addLog(`Error reading balance statistics from block node.`);
      }
    } finally {
      setIsFetchingBalance(false);
    }
  };

  const getProvider = (): any => {
    if (providerType === "phantom") {
      return (window as any).phantom?.solana || (window as any).solana;
    }
    if (providerType === "solflare") {
      return (window as any).solflare;
    }
    return (window as any).solana || (window as any).phantom?.solana || (window as any).solflare;
  };

  // Interactive connection
  const handleConnect = async (preferredProvider: "phantom" | "solflare" | "injected") => {
    setIsConnecting(true);
    setConnectionError(null);
    setProviderType(preferredProvider);
    addLog(`Connecting to browser-injected wallet application (${preferredProvider.toUpperCase()})...`);

    try {
      let provider: any = null;
      if (preferredProvider === "phantom") {
        provider = (window as any).phantom?.solana || (window as any).solana;
      } else if (preferredProvider === "solflare") {
        provider = (window as any).solflare;
      } else {
        provider = (window as any).solana || (window as any).phantom?.solana || (window as any).solflare;
      }

      if (!provider) {
        throw new Error(`${preferredProvider.toUpperCase()} extension is not injected in your web browser. Please install the wallet browser extension to sign web3 leases.`);
      }

      // Check if wallet supports direct standard connect
      const resp = await provider.connect();
      const pubKeyStr = provider.publicKey ? provider.publicKey.toString() : resp.publicKey?.toString();
      
      if (!pubKeyStr) {
        throw new Error("No public key reference retrieved from authorization payload.");
      }

      setWalletAddress(pubKeyStr);
      addLog(`Wallet connection authorized! Connected account address: ${pubKeyStr}`);
      fetchBalance(pubKeyStr);

      // Listen for connection events
      provider.on?.("disconnect", () => {
        setWalletAddress(null);
        setSolBalance(null);
        addLog("Wallet connection closed by user or external driver script.");
      });

    } catch (err: any) {
      console.error(err);
      setConnectionError(err.message || "User rejected the security signature request.");
      setProviderType(null);
      addLog(`Connection Exception: ${err.message || "User canceled authentication"}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const provider = getProvider();
      if (provider?.disconnect) {
        await provider.disconnect();
      }
    } catch (err) {
      console.error(err);
    }
    setWalletAddress(null);
    setSolBalance(null);
    setSignatureOutput(null);
    setTxSignature(null);
    setProviderType(null);
    addLog("Disconnected wallet authorization cleanly.");
  };

  // Sign human-readable message using standard pocket app wallet adapter mechanics
  const handleSignMessage = async () => {
    const provider = getProvider();
    if (!provider) {
      addLog("Cannot execute signature: Provider object not matched.");
      return;
    }
    setIsSigningMessage(true);
    setSignatureOutput(null);
    addLog(`Dispatching signature authorization dialog to browser wallet...`);

    try {
      const encoder = new TextEncoder();
      const messageBytes = encoder.encode(signMessageText);
      
      let signed: any;
      if (provider.signMessage) {
        signed = await provider.signMessage(messageBytes, "utf8");
      } else {
        throw new Error("Connected wallet does not support human-readable message signing standard.");
      }

      // Extract signature hex/base58 representation
      const signatureBytes = signed.signature || signed;
      // Convert buffer array to Hex string
      const signatureHex = Array.from(new Uint8Array(signatureBytes))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      
      const compressedHex = signatureHex.slice(0, 32) + "..." + signatureHex.slice(-16);
      setSignatureOutput(signatureHex);
      addLog(`Lease cryptographic signature received successfully: ${compressedHex}`);

      if (onAddTransaction) {
        onAddTransaction({
          id: `tx-${Math.floor(Math.random() * 90000) + 10000}`,
          type: "mining",
          title: `Solana Lease Proof Signed: auth_key=${walletAddress?.slice(0,6)}...`,
          amount: 15, // Arbitrary reward credits for testing
          timestamp: new Date().toISOString().replace("T", " ").slice(0,19)
        });
      }
    } catch (err: any) {
      console.error(err);
      addLog(`Signature Error: ${err.message || "User canceled authorization."}`);
    } finally {
      setIsSigningMessage(false);
    }
  };

  // Request a real Transaction build, fee gas fetching, and sign with provider
  const handleSendTransaction = async () => {
    const provider = getProvider();
    if (!provider || !walletAddress) {
      addLog("Cannot dispatch transaction builder: Secure key provider is unassigned.");
      return;
    }

    if (!transferDest || transferDest.trim() === "") {
      addLog("Validation failed: Target destination Solana Address is required.");
      return;
    }

    setIsSubmittingTx(true);
    setTxSignature(null);
    addLog(`Initializing transfer transaction sequence of ${transferAmount} SOL...`);

    try {
      const fromPubkey = new PublicKey(walletAddress);
      
      let toPubkey: PublicKey;
      try {
        toPubkey = new PublicKey(transferDest.trim());
      } catch (e) {
        throw new Error("Invalid destination Solana address. Please verify structural string layout.");
      }

      const connection = new Connection(rpcUrl, "confirmed");
      addLog(`Fetching transaction parameters and fee block hashes...`);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

      // Set calculation
      const lamports = parseFloat(transferAmount) * LAMPORTS_PER_SOL;
      
      // Build transactional payload
      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      transaction.feePayer = fromPubkey;
      transaction.recentBlockhash = blockhash;

      addLog(`Dispatching hardware transfer transaction to browser wallet for secure signature...`);
      const signedTransaction = await provider.signTransaction(transaction);
      
      addLog(`Transaction signing successful! Broadcasting payload to Solana validator pool...`);
      const rawTx = signedTransaction.serialize();
      const signature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: "confirmed"
      });

      addLog(`Asset broadcast complete! Retaining confirmation signature: ${signature}`);
      setTxSignature(signature);

      // Trigger transaction log ingestion
      if (onAddTransaction) {
        onAddTransaction({
          id: `sol-${signature.slice(0, 8)}`,
          type: "purchase",
          title: `Real SOL Transfer: Sent ${transferAmount} SOL to ${transferDest.slice(0, 6)}...`,
          amount: -50, // Register sandbox capital flow debit
          timestamp: new Date().toISOString().replace("T", " ").slice(0,19)
        });
      }

      // Re-fetch balance soon
      setTimeout(() => fetchBalance(walletAddress), 4000);

    } catch (err: any) {
      console.error(err);
      addLog(`Solana Network Error: ${err.message || "User declined transaction execution."}`);
    } finally {
      setIsSubmittingTx(false);
    }
  };

  // Check on load if standard providers have active connections
  useEffect(() => {
    const checkConnected = async () => {
      try {
        const provider = (window as any).phantom?.solana || (window as any).solana;
        if (provider?.isPhantom && provider?.publicKey) {
          setWalletAddress(provider.publicKey.toString());
          setProviderType("phantom");
          fetchBalance(provider.publicKey.toString());
          addLog("Automatically synced existing active Phantom session.");
        }
      } catch {
        // fail silent on load
      }
    };
    checkConnected();
  }, []);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-full text-slate-100">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/5 to-transparent blur-xl pointer-events-none" />
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl text-purple-400">
            <Coins className="w-5.5 h-5.5" />
          </div>
          <div className="text-left">
            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              S.O.U.L Web3 Solana Wallet
              <span className="text-[9px] font-mono font-bold tracking-wider bg-purple-950 text-purple-400 border border-purple-900 px-1.5 py-0.5 rounded uppercase uppercase-first">Adapter Live</span>
            </h2>
            <p className="text-xs text-slate-400">Connect and sign real autonomous micro-transactions with browser-attached web3 hardware wallets.</p>
          </div>
        </div>

        {/* Network Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 p-1 rounded-lg">
          <button
            onClick={() => setNetwork("devnet")}
            className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded transition select-none cursor-pointer ${network === "devnet" ? "bg-purple-900/50 text-purple-300 font-bold" : "text-slate-500 hover:text-slate-300"}`}
            title="Switch to Solana Devnet Index (Highly recommended for testing)"
          >Devnet</button>
          <button
            onClick={() => setNetwork("mainnet-beta")}
            className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded transition select-none cursor-pointer ${network === "mainnet-beta" ? "bg-purple-900/50 text-purple-300 font-bold" : "text-slate-500 hover:text-slate-300"}`}
            title="Switch to Solana Mainnet production cluster"
          >Mainnet</button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {connectionError && (
        <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3 mb-4 text-xs flex gap-2 items-start text-left text-red-300">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider block text-[10px] mb-0.5 leading-none">Wallet Exception Detected</span>
            <p className="leading-relaxed">{connectionError}</p>
          </div>
        </div>
      )}

      {/* DISCONNECTED STATE CARD */}
      {!walletAddress ? (
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 py-8">
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-full text-slate-500 shrink-0">
            <Wallet className="w-8 h-8 animate-pulse text-purple-500/70" />
          </div>
          <div>
            <span className="font-display font-semibold text-sm text-slate-200 block">Deploy Real Identity Web3 Adapter</span>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm">
              Link Phantom, Solflare, or standard injected browser wallets. Sign cryptographic leases with your own real private Solana keychains.
            </p>
          </div>

          <div className="flex gap-2 w-full max-w-xs flex-col sm:flex-row pt-2">
            <button
              onClick={() => handleConnect("phantom")}
              disabled={isConnecting}
              className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 hover:border-purple-500/20 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 text-slate-200 transition cursor-pointer select-none"
            >
              <img src="https://static.okx.com/cdn/assets/imgs/247/E7C2F6A8EB7CE8DC.png" alt="Phantom" className="w-3.5 h-3.5 rounded" referrerPolicy="no-referrer" />
              Phantom
            </button>
            <button
              onClick={() => handleConnect("solflare")}
              disabled={isConnecting}
              className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 hover:border-purple-500/20 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 text-slate-200 transition cursor-pointer select-none"
            >
              <img src="https://solflare.com/assets/images/logo-icon.svg" alt="Solflare" className="w-3.5 h-3.5 rounded" referrerPolicy="no-referrer" />
              Solflare
            </button>
          </div>
          
          <button
            onClick={() => handleConnect("injected")}
            disabled={isConnecting}
            className="text-[10px] uppercase tracking-wide font-mono text-purple-500 hover:text-purple-400 select-none cursor-pointer"
          >
            Or use default injected Solana agent
          </button>
        </div>
      ) : (
        /* CONNECTED WALLET DASHBOARD MODULE */
        <div className="space-y-5 flex-1 flex flex-col">
          
          {/* PROFILE BOARD */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-3 bg-purple-950/40 border border-purple-900/30 rounded-xl text-purple-400 shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[10px] font-mono text-slate-500 leading-none mb-1 font-bold">CONNECTED ACCOUNT</span>
                <span className="block text-xs font-mono text-slate-200 font-bold select-all truncate break-all pr-4 relative">
                  {walletAddress}
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5 uppercase">
                  Connected via: <strong className="text-purple-400">{providerType}</strong>
                </span>
              </div>
            </div>

            {/* Balances Board */}
            <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-2.5 px-4 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
              <div className="text-left">
                <span className="block text-[9px] font-mono text-slate-500 leading-none mb-1 font-bold">SOL BALANCE</span>
                <span className="block font-mono text-sm text-cyan-400 font-extrabold">
                  {solBalance !== null ? `${solBalance.toFixed(5)} SOL` : "--- SOL"}
                </span>
              </div>
              <button
                onClick={() => fetchBalance(walletAddress)}
                disabled={isFetchingBalance}
                className="p-1.5 bg-slate-950 hover:bg-slate-900 rounded-lg text-slate-400 border border-slate-800 cursor-pointer"
                title="Refresh blockchain balance"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingBalance ? "animate-spin text-purple-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* SPLIT PLAYBOOK & EXPERIMENT TILES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            
            {/* BOX 1: DISPATCH TRANS-ACTIONS / MEMO PROOFS */}
            <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4.5 text-left flex flex-col space-y-3 justify-between">
              <div>
                <span className="text-[10.5px] font-mono text-pink-400 font-bold tracking-wider uppercase flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5" /> Action A: Sign Lease Proof
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Verifies ownership and unlocks advanced multi-agent model slots on our servers. (Does not spend gas)
                </p>
                
                <div className="mt-3">
                  <textarea
                    rows={2}
                    value={signMessageText}
                    onChange={(e) => setSignMessageText(e.target.value)}
                    className="w-full text-xs font-sans bg-slate-900 border border-slate-800 rounded-lg p-2 outline-none text-slate-300 focus:border-pink-500/40 transition resize-none"
                  />
                </div>
              </div>

              <div>
                {signatureOutput && (
                  <div className="bg-slate-900/60 border border-slate-850 rounded-lg p-2 font-mono text-[9.5px] text-emerald-400 mb-2 truncate">
                    <span className="text-slate-500 block text-[8px] font-bold">AUTHENTICATED LEASE SIGNATURE:</span>
                    {signatureOutput}
                  </div>
                )}
                
                <button
                  onClick={handleSignMessage}
                  disabled={isSigningMessage}
                  className="w-full py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-xs font-mono font-bold uppercase rounded-lg border border-pink-500 select-none cursor-pointer flex items-center justify-center gap-1.5 text-white"
                >
                  {isSigningMessage ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Awaiting Wallet Signature...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-3.5 h-3.5" />
                      Sign Neural Lease Proof
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* BOX 2: DIRECT TRANSFER (GAS REQUIRED) */}
            <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4.5 text-left flex flex-col space-y-3 justify-between">
              <div>
                <span className="text-[10.5px] font-mono text-cyan-400 font-bold tracking-wider uppercase flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Action B: Direct SOL Transfer
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sign & transmit structured transfer payloads directly onto the decentralized validator chain.
                </p>

                <div className="space-y-2 mt-2.5">
                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Destination SOL Recipient Address</label>
                    <input
                      type="text"
                      placeholder="Enter base58 address..."
                      value={transferDest}
                      onChange={(e) => setTransferDest(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 outline-none text-slate-350 focus:border-cyan-500/30 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Transfer Amount (SOL)</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 outline-none text-slate-350 focus:border-cyan-500/30"
                    />
                  </div>
                </div>
              </div>

              <div>
                {txSignature && (
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=${network}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between text-cyan-400 hover:text-cyan-300 font-mono text-[9px] bg-slate-905 border border-slate-850 rounded-lg p-2.5 mb-2.5 hover:bg-slate-900 transition leading-none"
                  >
                    <span>EXPLORER LINK: {txSignature.slice(0, 16)}...</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}

                <button
                  onClick={handleSendTransaction}
                  disabled={isSubmittingTx || !transferDest}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-xs font-mono font-bold uppercase rounded-lg border border-cyan-500 select-none cursor-pointer flex items-center justify-center gap-1.5 text-white"
                >
                  {isSubmittingTx ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Broadcasting tx...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Sign & Broadcast Transfer
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* TELEMETRY LOGGER OUTPUT PANEL */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex-1 flex flex-col text-left">
            <span className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest block border-b border-slate-900 pb-1.5 mb-1.5 font-bold flex items-center gap-1 select-none">
              <Terminal className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> Web3 Sandbox Telemetry Logs
            </span>
            <div className="font-mono text-[10.5px] text-slate-400 space-y-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin flex-1 font-medium bg-slate-950">
              {web3Logs.map((log, index) => (
                <div key={index} className="truncate select-text">
                  <span className="text-slate-650 font-bold">&#8250;</span> {log}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleDisconnect}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-805 hover:border-red-500/20 text-slate-500 hover:text-red-400 rounded-lg font-mono text-[10px] select-none uppercase cursor-pointer"
            >
              Close Web3 Auth Tunnel
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
