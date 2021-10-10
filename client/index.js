import "./index.scss";
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const SHA256 = require("crypto-js/sha256");

const server = "http://localhost:3042";

// 
// Used to auto load addresses into inputs for debugging
// 
// window.addEventListener('load', () => {
//     fetch(`${server}/addresses`).then((response) => {
//       return response.json();
//     }).then(({ address1, address2}) => {
//       document.getElementById("exchange-address").value = address1;
//       document.getElementById("recipient").value = address2;
//     });
// });

document.getElementById("exchange-address").addEventListener('input', ({ target: {value} }) => {
  if(value === "") {
    document.getElementById("balance").innerHTML = 0;
    return;
  }

  fetch(`${server}/balance/${value}`).then((response) => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});

document.getElementById("transfer-amount").addEventListener('click', () => {
  const sender = document.getElementById("exchange-address").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;
  
  //
  // simple verification on input parameters
  //
  if(sender === "") {
    alert('must enter address in wallet')
    return
  }

  if(sender === recipient) {
    alert('wallet address and recipient cannot be same address')
    return
  } 
  
  if(amount == '') {
    alert('must enter an amount')
    return
  }
  const tx = {
    sender, amount, recipient, 
  }
  
  //
  // get private key from user and sign transaction
  //
  const privateKey = prompt('Enter Private key to sign transaction')
  const hash = SHA256(JSON.stringify(tx)).toString()  
  const sig = ec.sign(hash, privateKey,"hex", {canonical: true});

  const body = JSON.stringify({
    tx, sig
  });

  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' }}).then(response => {
    return response.json();
  }).then(({ isValid, balance }) => {
    document.getElementById("balance").innerHTML = balance;
    if(isValid) {
      alert(`Tranaction successfull sent $${tx.amount} to ${tx.recipient}`)
    } else {
      alert('Transaction failed')
    }

  });
});
