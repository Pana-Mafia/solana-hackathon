import './App.css';
import React, { FC, useMemo, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import idl from './idl.json';
import {
  getPhantomWallet,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider, WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';

// MUI UI components
import { Button, Input, TextField, InputAdornment } from '@mui/material';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  getPhantomWallet()
]
const { SystemProgram, Keypair } = web3;
/* create an account  */
const baseAccount = Keypair.generate();
const opts = {
  preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);
function App() {
  const [value, setValue] = useState(null);
  const isConnectedToWallet = value;
  const wallet = useWallet();
  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }
  async function createCounter() {
    const provider = await getProvider()
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);
    try {
      /* interact with the program via rpc */
      await program.rpc.create({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log('account: ', account);
      setValue(account.count.toString());
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }
  async function increment() {
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    await program.rpc.increment({
      accounts: {
        baseAccount: baseAccount.publicKey
      }
    });
    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('account: ', account);
    setValue(account.count.toString());
  }
  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div className="all-wrapper" style={{ color: '#FFFFFF' }} >
        <div className="content-wrapper">
          <div className="flex-center flex-col height-100" style={{ textAlign: 'center' }}>
            <div>
              <h1>Walletを接続してください。</h1>
              <WalletMultiButton style={{ display: 'initial', textAlign: 'center' }} />
            </div>
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <div className="all-wrapper" style={{ color: '#FFFFFF' }} >
        <div className="content-wrapper">
          <div className="flex-align-center flex-col">
            <div>
              <h1 className='mg-top-30pct'>トークンの発行総数を決めてください。</h1>
              <div style={{ backgroundColor: 'lightgray', padding: '2em' }} >
                <TextField
                  label="発行総数"
                  fullWidth
                  id="outlined-end-adornment"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">個</InputAdornment>,
                  }}
                />
              </div>
              <br />
              <h1>成し遂げたい事を記載してください。</h1>
              <div style={{ backgroundColor: 'lightgray', padding: '2em' }} >
                <TextField
                  label="内容"
                  fullWidth
                  id="outlined-end-adornment"
                />
              </div>
              <br />
              <div style={{ padding: '2em' }} >
                <Button variant="contained" color="success" onClick={() => { alert('clicked'); }}>
                  トークンを発行する
                </Button>
              </div>
              {/* ここに発行ボタンを入れる */}
              <br />
              <h1 className='mg-top-30pct'></h1>
              <WalletDisconnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
/* wallet configuration as specified here: https://github.com/solana-labs/wallet-adapter#setup */
const AppWithProvider = () => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)
export default AppWithProvider;