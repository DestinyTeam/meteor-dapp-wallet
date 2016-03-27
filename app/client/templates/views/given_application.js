Template['views_given_application'].helpers({
    'application': function() {
        return Helpers.getAccountByAddress(FlowRouter.getParam('address'));
    },
    /**
    Get the current jsonInterface, or use the wallet jsonInterface

    @method (jsonInterface)
    */
    'jsonInterface': function() {
        return this.jsonInterface;
    }
});
