/**
Template Controllers

@module Templates
*/


Template['views_applications'].helpers({
    /**
    Get all applications

    @method (Applications)
    */
    'applications': function(){
        console.log(Applications.find({}, {sort:{symbol:1}}));
        return Applications.find({}, {sort:{symbol:1}});
    }
});

