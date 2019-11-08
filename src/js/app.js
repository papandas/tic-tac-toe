App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  accountType: 3,
  accountTypeArray: new Array('DEALER', 'SERVICE_CENTER', 'DRIVER'),
  loading: false,
  assetListArray: new Array(),
  calibrationListArray: new Array(),
  toast: Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
  }),
  init: function () {
    console.log("App initialized...")
    //return App.initWeb3();
    return App.LoadLandingPage();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContracts();
  },

  initContracts: function () {
    $.getJSON("./AssetsManagement.json", function (assetManagementChain) {
      console.log(assetManagementChain);
      App.contracts.AssetsManagement = TruffleContract(assetManagementChain);
      App.contracts.AssetsManagement.setProvider(App.web3Provider);
      App.contracts.AssetsManagement.deployed().then(function (assetManagementChain, error) {
        console.log(error)
        console.log("Contract Address:", 'https://rinkeby.etherscan.io/address/' + assetManagementChain.address);
        $('#contractDetails').empty();
        $('#contractDetails').html(`<h5 class="text-center">Contract</h5>
          <span class="badge badge-light ml-3"> ${assetManagementChain.address.slice(0, 12)}...${assetManagementChain.address.slice(-8)}</span>
          <a class="dropdown-item" href="https://ropsten.etherscan.io/address/${assetManagementChain.address}" target="_blank">View On Etherscan</a>`)

      });
      App.listenForEvents();
      return App.render();
    })
  },

  // Listen for events emitted from the contract
  listenForEvents: function () {
    
  },
  render: function () {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    //console.log("Web3 Version:", web3.version.api)

    // Load account data
    $('#accountDetails').empty();
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        if (account === null) {
          App.LoadLandingPage();
        } else {
          App.account = account;
          console.log("Account Address:", account);
          web3.eth.getBalance(App.account, function (err, resp) {

            if (err === null) {

              let balance = web3.fromWei(resp.toNumber(), 'ether')

              $('#accountDetails').html(`<h5 class="text-center">Account</h5>
                <span class="badge badge-light ml-3"> ${App.account.slice(0, 12)}...${App.account.slice(-8)}</span>
                <a class="dropdown-item" href="#">Balance: ${balance.slice(0, 7)} ETH</a>
                <a class="dropdown-item" href="#" id="accountType"></a>
                <a class="dropdown-item" href="https://ropsten.etherscan.io/address/${account}" target="_blank">View On Etherscan</a>`)
            }
          });
          
        }

      }
    });

    App.LoadLandingPage();

    content.show();
    loader.hide();

  },



  LoadLandingPage: function () {
    $('#loader').hide();
    $('#content').show();
    $('#content').empty();
    $('#content').load('landing.html');
    console.log("Landing Done")
  },

}

$(function () {
  $(window).load(function () {
    App.init();
  })
});
