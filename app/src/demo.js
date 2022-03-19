import logo from './logo.svg';
import './App.css';
import { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';
import idl from './idl.json';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

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

  // 処理を追加
  const anchor = require("@project-serum/anchor");
  const assert = require("assert");
  const serumCmn = require("@project-serum/common");
  const TokenInstructions = require("@project-serum/serum").TokenInstructions;

  const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
    TokenInstructions.TOKEN_PROGRAM_ID.toString()
  );

  async function getTokenAccount(provider, addr) {
    console.log("getokenacc")
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

  console.log("２")
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
  console.log("３")
  async function mintNewToken() {

    const anchor = require("@project-serum/anchor");
    const assert = require("assert");

    const serumCmn = require("@project-serum/common");
    const TokenInstructions = require("@project-serum/serum").TokenInstructions;

    let mint = 100;
    let from = null;
    let to = null;


    const provider = await getProvider()
    const program = new Program(idl, programID, provider);

    // mint = await createMint(provider);
    // from = await createTokenAccount(provider, mint, provider.wallet.publicKey);
    // to = await createTokenAccount(provider, mint, provider.wallet.publicKey);

    try {
      console.log("4")
      await program.rpc.proxyMintTo(new anchor.BN(1000), {
        accounts: {
          authority: provider.wallet.publicKey,
          mint,
          to: provider.wallet.publicKey,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
        },
      })

      console.log("成功")
      const fromAccount = await getTokenAccount(provider, from);
      assert.ok(fromAccount.amount.eq(new anchor.BN(1000)));

    } catch (err) {
      console.log("5")
      console.log("Transaction error: ", err);
    }
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
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    return (
      <div className="App">
        <div>
          {
            !value && (<button onClick={mintNewToken}>Create token</button>)
          }
          {
            value && value >= Number(0) ? (
              <h2>{value}</h2>
            ) : (
              <h3>Please create the counter.</h3>
            )
          }
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