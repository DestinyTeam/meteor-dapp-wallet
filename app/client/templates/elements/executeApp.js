/**
Template Controllers

@module Templates
*/

/**
The execute contract template

@class [template] elements_executeContract
@constructor
*/
globalToken={}

var name2name = function(param){
  if(param.split(" ").length==1)
    return param;
  return param.split(" ")[0]+" ";
 }

Template['elements_executeApp'].onCreated(function(){
    var template = this;

    // Set Defaults
    TemplateVar.set('sending', false);

    // show execute part if its a custom contract
    if(CustomContracts.findOne({address: template.data.address}))
        TemplateVar.set('executionVisible', true);

    // check address for code
    web3.eth.getCode(template.data.address, function(e, code) {
        if(!e && code.length > 2) {
            TemplateVar.set(template, 'hasCode', true);
        }
    });
});


Template['elements_executeApp'].helpers({
    /**
    Reruns when the data context changes

    @method (reactiveContext)
    */
    'reactiveContext': function() {
        var contractInstance = web3.eth.contract(this.jsonInterface).at(this.address);
        globalToken=Tokens.findOne({address: this.address});
        var contractFunctions = [];
        var contractConstants = [];
        _.each(this.jsonInterface, function(func, i){

            // Walk throught the jsonInterface and extract functions and constants
            if(func.type == 'function') {
                func.contractInstance = contractInstance;

                func.displayName = func.name.replace(/([A-Z])/g, ' $1');
                func.inputs = _.map(func.inputs, Helpers.createTemplateDataFromInput);

                if(func.constant){
                    // if it's a constant   
                    func.displayName = func.displayName.replace(/([\_])/g, '<span class="punctuation">$1</span>');
                      contractConstants.push(func); 
                } else {
                    //if its a variable
                    contractFunctions.push(func);                
                }
                
            }
        });

        TemplateVar.set('contractConstants', contractConstants);
        TemplateVar.set('contractFunctions', contractFunctions);
    }
});

Template['elements_executeApp'].events({
    /**
    Select a contract function
    
    @event 'change .select-contract-function
    */
    'change .select-contract-function': function(e, template){
        TemplateVar.set('executeData', null);


        // change the inputs and data field
        TemplateVar.set('selectedFunction', _.find(TemplateVar.get('contractFunctions'), function(contract){
            return contract.name === e.currentTarget.value;
        }));

        Tracker.afterFlush(function(){
            $('.abi-input').trigger('change');
        });
    },
    /**
    Click the show hide button

    @event click .toggle-visibility
    */
    'click .toggle-visibility': function(){
        TemplateVar.set('executionVisible', !TemplateVar.get('executionVisible'));
    }
});



/**
The contract constants template

@class [template] elements_executeContract_constant
@constructor
*/

/**
Formats the values for display

@method formatOutput
*/
var formatOutput = function(val) {
    if(_.isArray(val))
        return _.map(val, formatOutput);
    else {

        // stringify boolean
        if(_.isBoolean(val))
            val = val ? 'YES' : 'NO';

        // convert bignumber objects
        val = (_.isObject(val) && val.toString)
            ? val.toString(10)
            : val;

        return val;
    }
};
var formatOutputEnriched = function(output) {
    val=output.value;
    if(_.isArray(val))
        return _.map(val, formatOutput);
    else {

        // stringify boolean
        if(_.isBoolean(val))
            val = val ? 'YES' : 'NO';

        // convert bignumber objects
       
        if(output.representation=="value, satoshi"){
            val= Helpers.formatNumberByDecimals(val, globalToken.decimals) +' '+ globalToken.symbol
        }

        val = (_.isObject(val) && val.toString)
            ? val.toString(10)
            : val;

        return val;
    }
};

Template['elements_executeApp_constant'].onCreated(function(){
    var template = this;

    // call the contract functions when data changes and on new blocks
    this.autorun(function() {
        // make reactive to the latest block
        EthBlocks.latest;

        // get args for the constant function
        var args = TemplateVar.get('inputs') || [];
        for(i=0; i<args.length; i++){ if(args[i]===""){args[i]=0}};

        // add callback
        args.push(function(e, r) {
            if(!e) {
                var outputs = [];
                // single return value
                if(template.data.outputs.length === 1) {
                    template.data.outputs[0].value = r;
                    template.data.outputs[0].displayName = template.data.outputs[0].name.replace(/([A-Z])/g, ' $1');

                    outputs.push(template.data.outputs[0]);

                // multiple return values
                } else {
                    outputs = _.map(template.data.outputs, function(output, i) {
                        output.value = r[i];
                        output.displayName = output.name
                        .replace(/([A-Z])/g, ' $1')        
                        .replace(/([\-\_])/g, '<span class="punctuation">$1</span>');
;

                        return output;
                    });
                }

                TemplateVar.set(template, 'outputs', outputs);
            } 
        });
        //console.log("contractInstance")
        //console.log(template.data)
        //console.log(name2name(template.data.name))
        //console.log(template.data.contractInstance[name2name(template.data.name)])
        //console.log(args);
        template.data.contractInstance[name2name(template.data.name)].apply(null, args);

    });
});

Template['elements_executeApp_constant'].helpers({
    /**
    Formats the value if its a big number or array

    @method (value)
    */
    'value': function() {
        return _.isArray(this.value) ? formatOutputEnriched(this) : [formatOutputEnriched(this)];
    },
    /**
    Figures out extra data

    @method (extra)
    */
    'extra': function() {
        var data = formatOutput(this); // 1000000000
        // console.log('data', data);

        if (data > 1400000000 && data < 1800000000 && Math.floor(data/1000) != data/1000) {
            return '(' + moment(data*1000).fromNow() + ')';
        }

        if (data == 'YES') {
            return '<span class="icon icon-check"></span>';
        } else if (data == 'NO') {
            return '<span class="icon icon-ban"></span>'
        }
        return;
    }
});

Template['elements_executeApp_constant'].events({
    /**
    React on user input on the constant functions

    @event change .abi-input, input .abi-input
    */
    'change .abi-input, input .abi-input': function(e, template) {
        var inputs = Helpers.addInputValue(template.data.inputs, this, e.currentTarget);

        TemplateVar.set('inputs', inputs);
    }
});





/**
The contract function template

@class [template] elements_executeContract_function
@constructor
*/


Template['elements_executeApp_function'].onCreated(function(){
    var template = this;

    // change the amount when the currency unit is changed
    template.autorun(function(c){
        var unit = EthTools.getUnit();

        if(!c.firstRun) {
            TemplateVar.set('amount', EthTools.toWei(template.find('input[name="amount"]').value.replace(',','.'), unit));
        }
    });
});

Template['elements_executeApp_function'].onRendered(function(){
    // Run all inputs through formatter to catch bools
    this.$('.abi-input').trigger('change');
});

Template['elements_executeContract_function'].helpers({
    'reactiveDataContext': function(){
        if(this.inputs.length === 0)
            TemplateVar.set('executeData', this.contractInstance[name2name(this.name)].getData());
    }
});

Template['elements_executeApp_function'].events({
    /**
    Set the amount while typing
    
    @event keyup input[name="amount"], change input[name="amount"], input input[name="amount"]
    */
    'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(e, template){
        var wei = EthTools.toWei(e.currentTarget.value.replace(',','.'));
        TemplateVar.set('amount', wei || '0');
    },
    /**
    React on user input on the execute functions

    @event change .abi-input, input .abi-input
    */
    'change .abi-input, input .abi-input': function(e, template) {
        var inputs = Helpers.addInputValue(template.data.inputs, this, e.currentTarget);
        console.log('inputs: ', inputs)
    
        TemplateVar.set('executeData', template.data.contractInstance[name2name(template.data.name)].getData.apply(null, inputs));
    },
    /**
    Executes a transaction on contract

    @event click .execute
    */
    'click .execute': function(e, template){
        var to = template.data.contractInstance.address,
            gasPrice = 50000000000,
            estimatedGas = undefined, /* (typeof mist == 'undefined')not working */
            amount = TemplateVar.get('amount') || 0,
            selectedAccount = Helpers.getAccountByAddress(TemplateVar.getFrom('.execute-contract select[name="dapp-select-account"]', 'value')),
            data = TemplateVar.get('executeData');

        var latestTransaction =  Transactions.findOne({}, {sort: {timestamp: -1}});
        if (latestTransaction && latestTransaction.gasPrice)
            gasPrice = latestTransaction.gasPrice; 
        if(selectedAccount) {

            console.log('Providing gas: ', estimatedGas ,' + 100000');

            if(selectedAccount.balance === '0')
                return GlobalNotification.warning({
                    content: 'i18n:wallet.send.error.emptyWallet',
                    duration: 2
                });


            var estimateGas = function(){
                   web3.eth.estimateGas({
                        from: selectedAccount.address,
                        to: to,
                        data: data,
                        value: amount,
                        gasPrice: gasPrice,
                        gas: estimatedGas
                    }, function(error, GAS){
                        
                        estimatedGas=GAS;
                        modalQuestionSend();
                    });
            }
            // The function to send the transaction
            var sendTransaction = function(estimatedGas){

                TemplateVar.set('sending', true);
                pw = $('.send-transaction-info input[name="unlock"]').val();
                estimatedGas=$('.send-transaction-info input[name="providedGas"]').val();
                if(!pw)
                    pw= JSON.parse(localStorage.savedPasswords)[selectedAccount.address];

	        TemplateVar.set('unlocking', true);
		web3.personal.unlockAccount(selectedAccount.address, pw || '', 2, function(e, res){
		    pw = null;
		    TemplateVar.set(template, 'unlocking', false);

		    if(!e && res) {
                        sendTransactionAfterUnlock(estimatedGas);
		        ipcProviderWrapper.send('backendAction_unlockedAccount', null, estimatedGas);
			

		    } else {
		        Tracker.afterFlush(function(){
		            template.find('input[type="password"]').value = '';
		            template.$('input[type="password"]').focus();
		        });

		        GlobalNotification.warning({
		            content: TAPi18n.__('mist.popupWindows.sendTransactionConfirmation.errors.wrongPassword'),
		            duration: 3
		        });
		    }
		});
              }
              var sendTransactionAfterUnlock = function(estimatedGas){
                // CONTRACT TX
                if(contracts['ct_'+ selectedAccount._id]) {

                    contracts['ct_'+ selectedAccount._id].execute.sendTransaction(to || '', amount || '', data || '', {
                        from: selectedAccount.owners[0],
                        gasPrice: gasPrice,
                        gas: estimatedGas
                    }, function(error, txHash){

                        TemplateVar.set(template, 'sending', false);

                        console.log(error, txHash);
                        if(!error) {
                            console.log('SEND from contract', amount);

                            addTransactionAfterSend(txHash, amount, selectedAccount.address, to, gasPrice, estimatedGas, data);

                            FlowRouter.go('dashboard');

                        } else {
                            // EthElements.Modal.hide();

                            GlobalNotification.error({
                                content: error.message,
                                duration: 8
                            });
                        }
                    });
                
                // SIMPLE TX
                } else {
                    console.log(to, gasPrice, estimatedGas, amount, selectedAccount, data);
        
                    web3.eth.sendTransaction({
                        from: selectedAccount.address,
                        to: to,
                        data: data,
                        value: amount,
                        gasPrice: gasPrice,
                        gas: estimatedGas
                    }, function(error, txHash){

                        TemplateVar.set(template, 'sending', false);

                        console.log(error, txHash);
                        if(!error) {
                            console.log('SEND simple');

                            addTransactionAfterSend(txHash, amount, selectedAccount.address, to, gasPrice, estimatedGas, data);

                            // FlowRouter.go('dashboard');
                            GlobalNotification.success({
                               content: "The transaction was executed",
                               duration: 2
                            });
                        } else {

                            // EthElements.Modal.hide();

                            GlobalNotification.error({
                                content: error.message,
                                duration: 8
                            });
                        }
                    });
                }   
            };
            var modalQuestionSend = function(){
		    if(typeof mist === 'undefined') {

		        console.log('estimatedGas: ' + estimatedGas);
		        
		        EthElements.Modal.question({
		            template: 'views_modals_sendTransactionInfo',
		            data: {
		                from: selectedAccount.address,
		                to: to,
		                amount: amount,
		                gasPrice: gasPrice,
		                estimatedGas: estimatedGas,
		                estimatedGasPlusAddition: estimatedGas + 100000, // increase the provided gas by 100k
		                unlockAccount: '',
		                data: data
		            },
		            ok: sendTransaction,
		            cancel: true
		        },{
		            class: 'send-transaction-info'
		        });

		    // LET MIST HANDLE the CONFIRMATION
		    } else {
		        sendTransaction(estimatedGas + 100000);
		    } 
              } 
             
            estimateGas();
        }
    }
});

