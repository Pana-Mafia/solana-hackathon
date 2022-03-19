import './App.css';
import React from 'react';
// import { Connection } from '@solana/web3.js';
// import { Provider } from '@project-serum/anchor';
import idl from './idl.json';
import {
  getPhantomWallet,
} from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
// import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider, WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';

// MUI UI components
import { Button, TextField, InputAdornment } from '@mui/material';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  getPhantomWallet()
]
// const { Keypair } = web3;
/* create an account  */
// const baseAccount = Keypair.generate();
// const opts = {
//   preflightCommitment: "processed"
// }
const programID = new PublicKey(idl.metadata.address);
function App() {
  // const [value] = useState(null);
  // const isConnectedToWallet = value;
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

  const anchor = require("@project-serum/anchor");
  const assert = require("assert");
  const serumCmn = require("@project-serum/common");
  const TokenInstructions = require("@project-serum/serum").TokenInstructions;

  const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
    TokenInstructions.TOKEN_PROGRAM_ID.toString()
  );

  async function getTokenAccount(provider, addr) {
    return await serumCmn.getTokenAccount(provider, addr);
  }

  async function getMintInfo(provider, mintAddr) {
    return await serumCmn.getMintInfo(provider, mintAddr);
  }

  async function createMint(provider, authority) {
    if (authority === undefined) {
      authority = provider.wallet.publicKey;
    }
    const mint = anchor.web3.Keypair.generate();
    const instructions = await createMintInstructions(
      provider,
      authority,
      mint.publicKey
    );

    const tx = new anchor.web3.Transaction();
    tx.add(...instructions);

    await provider.send(tx, [mint]);

    return mint.publicKey;
  }

  async function createMintInstructions(provider, authority, mint) {
    let instructions = [
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: mint,
        space: 82,
        lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
        programId: TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeMint({
        mint,
        decimals: 0,
        mintAuthority: authority,
      }),
    ];
    return instructions;
  }

  async function createTokenAccount(provider, mint, owner) {
    const vault = anchor.web3.Keypair.generate();
    const tx = new anchor.web3.Transaction();
    tx.add(
      ...(await createTokenAccountInstrs(provider, vault.publicKey, mint, owner))
    );
    await provider.send(tx, [vault]);
    return vault.publicKey;
  }

  async function createTokenAccountInstrs(
    provider,
    newAccountPubkey,
    mint,
    owner,
    lamports
  ) {
    if (lamports === undefined) {
      lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
    }
    return [
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey,
        space: 165,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeAccount({
        account: newAccountPubkey,
        mint,
        owner,
      }),
    ];
  }

  // 処理追加終わり
  async function mintNewToken() {
    console.log("mintNewToken is called.")

    const anchor = require("@project-serum/anchor");
    const assert = require("assert");

    const serumCmn = require("@project-serum/common");
    const TokenInstructions = require("@project-serum/serum").TokenInstructions;

    let mint = 1;
    let from = '2junxGTVZLmitbrS7qNHWLgPe9QLsApYaujsUFwsj5ym';
    let to = '2junxGTVZLmitbrS7qNHWLgPe9QLsApYaujsUFwsj5ym';


    const provider = await getProvider()
    console.log()
    const program = new Program(idl, programID, provider);

    // mint = await createMint(provider);
    // from = await createTokenAccount(provider, mint, provider.wallet.publicKey);
    // to = await createTokenAccount(provider, mint, provider.wallet.publicKey);

    try {
      await program.rpc.proxyMintTo(new anchor.BN(1000), {
        accounts: {
          authority: provider.wallet.publicKey,
          mint,
          to: provider.wallet.publicKey,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
        },
      })

      const fromAccount = await getTokenAccount(provider, from);
      assert.ok(fromAccount.amount.eq(new anchor.BN(1000)));

    } catch (err) {
      console.error(err)
    }
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
              <h1 className='mg-top-30pct'>Walletとの接続を切る。</h1>
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