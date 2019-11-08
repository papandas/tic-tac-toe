const TicTacToe = artifacts.require("./TicTacToe.sol");
const LibString = artifacts.require("./LibString.sol");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
let gamesInstance, libStringInstance;

contract('Tic Tac Toe', function (accounts) {
    const player1 = accounts[0];
    const player2 = accounts[1];
    const randomUser = accounts[5];
    const testingGasPrice = 100000000000;

    it("should be deployed", async function () {
        gamesInstance = await TicTacToe.deployed();
        assert.isOk(gamesInstance, "instance should not be null");
        assert.equal(typeof gamesInstance, "object", "Instance should be an object");

        const timeout = await gamesInstance.timeout.call();
        assert.equal(timeout.toNumber(), 2, "The base timeout to test should be set to 2");

        libStringInstance = await LibString.deployed();
        assert.isOk(libStringInstance, "instance should not be null");
        assert.equal(typeof libStringInstance, "object", "Instance should be an object");
    });

    it("should start with no games at the begining", async function () {
        let gamesIdx = await gamesInstance.getOpenGames.call();
        assert.deepEqual(gamesIdx, [], "Should have zero games at the begining");
    });

    it("should use the saltedHash function from the library", async function () {
        let hash1 = await libStringInstance.saltedHash.call(123, "my salt 1");
        let hashA = await gamesInstance.saltedHash.call(123, "my salt 1");

        let hash2 = await libStringInstance.saltedHash.call(123, "my salt 2");
        let hashB = await gamesInstance.saltedHash.call(123, "my salt 2");

        let hash3 = await libStringInstance.saltedHash.call(234, "my salt 1");
        let hashC = await gamesInstance.saltedHash.call(234, "my salt 1");

        assert.equal(hash1, hashA, "Contract hashes should match the library output");
        assert.equal(hash2, hashB, "Contract hashes should match the library output");
        assert.equal(hash3, hashC, "Contract hashes should match the library output");

        assert.notEqual(hash1, hash2, "Different salt should produce different hashes");
        assert.notEqual(hash1, hash3, "Different numbers should produce different hashes");
        assert.notEqual(hash2, hash3, "Different numbers and salt should produce different hashes");
    });

    it("should create a game with no money", async function () {
        var gameIdx
        let hash = await libStringInstance.saltedHash.call(123, "my salt 1");
        
        let tx = await gamesInstance.createGame(hash, "John");

        assert.equal(await web3.eth.getBalance(gamesInstance.address), 0, "The contract should have registered a zero amount of ether owed to the players");

        truffleAssert.eventEmitted(tx, 'GameCreated', (ev) => {
            //return ev.player === bettingAccount && ev.betNumber.eq(ev.winningNumber);
            gameIdx = ev.gameIdx.toNumber();
            return ev.gameIdx.toNumber() === 0 
        });

        let gamesIdx = await gamesInstance.getOpenGames.call();
        gamesIdx = gamesIdx.map(n => n.toNumber());
        assert.include(gamesIdx, gameIdx, "Should include the new game");


        let gameInfo = await gamesInstance.getGameInfo(gameIdx);
        let cells = gameInfo[0].map(n => n.toNumber());
        let status = gameInfo[1];
        let amount = gameInfo[2];
        let nick1 = gameInfo[3];
        let nick2 = gameInfo[4];
        assert.deepEqual(cells, [0, 0, 0, 0, 0, 0, 0, 0, 0], "The board should be empty");
        assert.equal(status.toNumber(), 0, "The game should not be started");
        assert.equal(amount.toNumber(), 0, "The game should have no money");
        assert.equal(nick1, "John", "The player 1 should be John");
        assert.equal(nick2, "", "The player 2 should be empty");

        let lastTransaction = await gamesInstance.getGameTimestamp(gameIdx);
        assert.isAbove(lastTransaction.toNumber(), 0, "The last timestamp should be set");

        let gamePlayers = await gamesInstance.getGamePlayers(gameIdx);
        assert.equal(gamePlayers[0], player1, "The address of player 1 should be set");
        assert.equal(gamePlayers[1], "0x0000000000000000000000000000000000000000", "The address of player 2 should be empty");
    });

    it("should create a game with money", async function () {
        let gameIdx;
        let hash = await libStringInstance.saltedHash.call(123, "my salt 1");

        let amountInWei = web3.utils.toWei('0.01', 'ether');

        let tx = await gamesInstance.createGame(hash, "Jane", { value: amountInWei });

        let balance = await web3.eth.getBalance(gamesInstance.address);
        assert.equal(balance, amountInWei, "The contract should have registered 0.01 ether owed to the players");

        truffleAssert.eventEmitted(tx, 'GameCreated', (ev) => {
            //return ev.player === bettingAccount && ev.betNumber.eq(ev.winningNumber);
            gameIdx = ev.gameIdx.toNumber();
            return ev.gameIdx.toNumber() === 1 
        });

        let gamesIdx = await gamesInstance.getOpenGames.call();
        gamesIdx = gamesIdx.map(n => n.toNumber());
        assert.include(gamesIdx, gameIdx, "Should include the new game");


        let gameInfo = await gamesInstance.getGameInfo(gameIdx);
        let cells = gameInfo[0].map(n => n.toNumber());
        let status = gameInfo[1];
        let amount = gameInfo[2];
        let nick1 = gameInfo[3];
        let nick2 = gameInfo[4];

        console.log(gameInfo)

        console.log(amount.toNumber(), web3.utils.fromWei(amountInWei, 'ether'))

        assert.deepEqual(cells, [0, 0, 0, 0, 0, 0, 0, 0, 0], "The board should be empty");
        assert.equal(status.toNumber(), 0, "The game should not be started");
        //assert.equal(amount.toNumber(), amountInWei, "The game should have no money");
        assert.equal(nick1, "Jane", "The player 1 should be John");
        assert.equal(nick2, "", "The player 2 should be empty");

        let lastTransaction = await gamesInstance.getGameTimestamp(gameIdx);
        assert.isAbove(lastTransaction.toNumber(), 0, "The last timestamp should be set");

        let gamePlayers = await gamesInstance.getGamePlayers(gameIdx);
        assert.equal(gamePlayers[0], player1, "The address of player 1 should be set");
        assert.equal(gamePlayers[1], "0x0000000000000000000000000000000000000000", "The address of player 2 should be empty");

        /*


        let [cells, status, amount, nick1, nick2, ...rest] = await gamesInstance.getGameInfo(gameIdx);
        cells = cells.map(n => n.toNumber());
        assert.deepEqual(cells, [0, 0, 0, 0, 0, 0, 0, 0, 0], "The board should be empty");
        assert.equal(status.toNumber(), 0, "The game should not be started");

        assert.equal(amount.comparedTo(web3.toWei(0.01, 'ether')), 0, "The game should have 0.01 ether");
        assert.equal(nick1, "Jane", "The player 1 should be Jane");
        assert.equal(nick2, "", "The player 2 should be empty");
        assert.deepEqual(rest, [], "The response should have 5 elements");

        let lastTransaction = await gamesInstance.getGameTimestamp(gameIdx);
        assert.isAbove(lastTransaction.toNumber(), 0, "The last timestamp should be set");

        let [p1, p2, ...rest3] = await gamesInstance.getGamePlayers(gameIdx);
        assert.equal(p1, player1, "The address of player 1 should be set");
        assert.equal(p2, "0x0000000000000000000000000000000000000000", "The address of player 2 should be empty");
        assert.deepEqual(rest3, [], "The response should have 2 elements");*/
    });

})