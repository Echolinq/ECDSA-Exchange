const express = require("express");
const EC = require("elliptic").ec;
const SHA256 = require("crypto-js/sha256");
const cors = require("cors");
const app = express();
const port = 3042;
const ec = new EC("secp256k1");
const balances = {};

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const key1 = ec.genKeyPair();
const key2 = ec.genKeyPair();
const key3 = ec.genKeyPair();


const address1 = SHA256(key1.getPublic().encode("hex")).toString().slice(-40);
const address2 = SHA256(key2.getPublic().encode("hex")).toString().slice(-40);
const address3 = SHA256(key3.getPublic().encode("hex")).toString().slice(-40);

balances[address1] = 100;
balances[address2] = 50;
balances[address3] = 75;

console.log(`
AVAILABLE ACCOUNTS
===================
${address1} (${balances[address1]})
${address2} (${balances[address2]})
${address3} (${balances[address3]})

PRIVATE KEYS
=============
${key1.getPrivate('hex')}
${key2.getPrivate('hex')}
${key3.getPrivate('hex')}
`);

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { tx, sig } = req.body;

  //tx.recipient = '377b1cdcb7148d1081e7d9b57286e42c9d9d5c9b' 
  //tx.amount = 377
  
  // hash transaction for verification
  let msg = SHA256(JSON.stringify(tx)).toString();

  // use signature and tranaction has to recover the public key for verification
  let hexToDecimal = (x) => ec.keyFromPrivate(x, "hex").getPrivate().toString(10);
  const recoveredPublicKey = ec.recoverPubKey(hexToDecimal(msg), sig, sig.recoveryParam, 'hex');

  // recover the address of the sender
  recoveredAddress = SHA256(recoveredPublicKey.encode("hex")).toString().slice(-40);

  // Checks that the recovered address is the same as the sender of the transaction
  const isValid = () =>{
    if(recoveredAddress === tx.sender)
      return true
    return false
  } 

  if (isValid()) {
    balances[tx.sender] -= tx.amount;
    balances[tx.recipient] = (balances[tx.recipient] || 0) + +tx.amount;
    res.send({ isValid: true, balance: balances[tx.sender] });
  } else {
    res.send({ isValid: false, balance: balances[tx.sender] });
  }
});

//
// Enpoint used for debugging to auto load address into form inputs
//
app.get("/addresses", (req, res) => {
  res.send({ address1, address2});
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
