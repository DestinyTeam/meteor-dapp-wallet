/**
Template Controllers

@module Templates
*/

/**
The dashboard template

@class [template] views_dashboard
@constructor
*/
var create_account = function(){
      pw = $('.create-account-popup input[name="passphrase"]').val();
      save = $('.create-account-popup input[name="savepass"]').val();
      if(save)
        {localStorage.setItem("tempPass",pw);}
      web3.personal.newAccount(pw, function(e,res){
              console.log("after newAcc", save, res, e);
	      if(!e && localStorage.tempPass)
		{
		   if(!localStorage.savedPasswords)
		     {
		         localStorage.savedPasswords=JSON.stringify({});
		     }
                   sP = JSON.parse(localStorage.savedPasswords);
		   sP[res]=localStorage.tempPass;
                   localStorage.savedPasswords=JSON.stringify(sP);
		}
             localStorage.removeItem("tempPass");
      });
    };

var addPeers = function(){
   admin=web3.admin;
   if(!admin)
      return false;
   nodes_list.forEach(function(node){admin.addPeer(node);});
   };


Template['views_dashboard'].helpers({
    /**
    Get all current wallets

    @method (wallets)
    */
    'wallets': function(disabled){
        var wallets = Wallets.find({disabled: disabled}, {sort: {creationBlock: 1}}).fetch();

        // sort wallets by balance
        wallets.sort(Helpers.sortByBalance);

        return wallets;
    },
    /**
    Get all current accounts

    @method (accounts)
    */
    'accounts': function(){
        //By the way try to add peers here;
        //addPeers();
        addDestiny();
      
        // balance need to be present, to show only full inserted accounts (not ones added by mist.requestAccount)
        var accounts = EthAccounts.find({name: {$exists: true}}, {sort: {name: 1}}).fetch();

        accounts.sort(Helpers.sortByBalance);

        return accounts;
    },
    /** 
    Are there any accounts?

    @method (hasAccounts)
    */
    'hasAccounts' : function() {
        return (EthAccounts.find().count() > 0);
    },

    /**
    Get all transactions

    @method (allTransactions)
    */
    'allTransactions': function(){
        return Transactions.find({}, {sort: {timestamp: -1}}).count();
    },
    /**
    Returns an array of pending confirmations, from all accounts
    
    @method (pendingConfirmations)
    @return {Array}
    */
    'pendingConfirmations': function(){
        return _.pluck(PendingConfirmations.find({operation: {$exists: true}, confirmedOwners: {$ne: []}}).fetch(), '_id');
    }
});


Template['views_dashboard'].events({


    
    /**
    Request to create an account
    
    @event click .create.account
    */
    'click .create.account': function(e){
        e.preventDefault();
	EthElements.Modal.question({
                    template: 'views_modals_createNewAccount',
                    data: {
                    },
                    ok: create_account,
                    cancel: true
                },{
                    class: 'create-account-popup'
                });
        
    }
});
