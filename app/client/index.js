Meteor.startup(function() {

    // SET default language
    if(Cookie.get('TAPi18next')) {
        TAPi18n.setLanguage(Cookie.get('TAPi18next'));
    } else {
        var userLang = navigator.language || navigator.userLanguage,
        availLang = TAPi18n.getLanguages();

        // set default language
        if (_.isObject(availLang) && availLang[userLang]) {
            TAPi18n.setLanguage(userLang);
            // lang = userLang;
        } else if (_.isObject(availLang) && availLang[userLang.substr(0,2)]) {
            TAPi18n.setLanguage(userLang.substr(0,2));
            // lang = userLang.substr(0,2);
        } else {
            TAPi18n.setLanguage('en');
            // lang = 'en';
        }
    }
    // change moment and numeral language, when language changes
    Tracker.autorun(function(){
        if(_.isString(TAPi18n.getLanguage())) {
            var lang = TAPi18n.getLanguage().substr(0,2);
            moment.locale(lang);
            numeral.language(lang);
            EthTools.setLocale(lang);
        }
    });


    //remove old destinyToken
    if (localStorage.hasAddedDestiny){
        destinyToken = '0x7041462d67ea5c3df16fad5c330388beb2ddfe71';
        tokenId = Helpers.makeId('token', destinyToken);
        Tokens.remove(tokenId);
        localStorage.removeItem('hasAddedDestiny');
    }
    //Add new
    if (Session.get('network') == 'mainnet' && !localStorage.hasAddedNewDestiny){
        localStorage.setItem('hasAddedNewDestiny', true);

        destinyToken = '0xb872385d1c132410b77058f34a4f2dfe94047d50';
        tokenId = Helpers.makeId('token', destinyToken);
        Tokens.upsert(tokenId, {$set: {
            address: destinyToken,
            name: 'Destiny',
            symbol: 'D',
            balances: {},
            decimals: 8
        }});    
    }
    if (Session.get('network') == 'mainnet' && !localStorage.hasAddedTDestiny){
        localStorage.setItem('hasAddedTDestiny', true);

        tDestinyToken = '0xb5e4ae1ac58caeac1b035dd39f34c72bddd83ced';
        tokenId = Helpers.makeId('token', tDestinyToken);
        Tokens.upsert(tokenId, {$set: {
            address: tDestinyToken,
            name: 'Test-Destiny',
            symbol: 'tD',
            balances: {},
            decimals: 8
        }});    
    }

});

