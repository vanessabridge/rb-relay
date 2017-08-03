const rlp = require('rlp')
const utils = require('ethereumjs-util')
const h = require('./helpers')
const EthProof = require('eth-proof')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io"))
const ep = new EthProof(new Web3.providers.HttpProvider("https://rinkeby.infura.io"))

const rbrelay = artifacts.require("./rbrelay.sol");
const target = artifacts.require("./Target.sol");

contract('rbrelay', function(accounts) {
  var rb, t, proof;

  it("should set everything up correctly", function(done) {
    ep.getTransactionProof('0x0901fd2fa414594b57b512983764ba66cb33d534d0048f60d796f1ef5c3e04f6').then(function(result) {
      proof = h.web3ify(result);
    }).then(function() {
      return rbrelay.deployed();
    }).then(function(instance) {
      rb = instance;
      return rb.startHash.call();
    }).then(function(result) {
      // console.log("\nstart hash: " + result + "\n");
      assert.equal(result, "0x9cc20c925e71c1df0d409a6a25d9da2cb82ed3da95b76152a5082e0af35b5d47", "start hash incorrect");
    }).then(function() {
      return target.deployed();
    }).then(function(instance) {
      t = instance;
      return t.txDone.call();
    }).then(function(result) {
      // console.log("done:\n" + JSON.stringify(result) + "\n");
      assert.isFalse(result, "done is not false");
    }).then(function() {
      done();
    });
  })

  it("should store block 617591", function(done) {
    rb.storeBlockHeader(proof.header).then(function(result) {
      // console.log("\nstoreBlockHeader:\n" + JSON.stringify(result) + "\n");
    }).then(function() {
      return rb.rbchain.call(proof.blockHash)
    }).then(function(result) {
      assert.equal(parseInt(result), 617591, "header 617591 was not stored correctly");
    }).then(function() {
      done();
    })
  })

  it("should relay tx 0x0901fd2fa414594b57b512983764ba66cb33d534d0048f60d796f1ef5c3e04f6", function(done) {
    rb.relayTx(proof.value, proof.path, proof.parentNodes, proof.header, t.address).then(function(result) {
      // console.log("\nrelayTx:\n" + JSON.stringify(result) + "\n");
    }).then(function() {
      return t.txDone.call();
    }).then(function(result) {
      // console.log("done:\n" + JSON.stringify(result) + "\n");
      assert.isTrue(result, "done is not true");
    }).then(function() {
        done();
    })
  })
})
