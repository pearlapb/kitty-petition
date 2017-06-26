var express = require('express'), router = express.Router();
const util = require('../config/utilities.js');

var bodyParser = require('body-parser');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var parseForm = bodyParser.urlencoded({ extended: false });

var redis = require('redis');
var client = redis.createClient({
    host: 'localhost',
    port: 6379
});
client.on('error', function(err) {
    console.log(err);
});

router.route('/about')

    .get( (req, res) => {
        res.render('about', {
            loggedIn: true,
        });
    });

router.route('/petition')

    .get( csrfProtection, (req, res) => {
        if (!req.session.user) {
            res.redirect('/login');
        } else {
            util.checkIfUserSigned(req.session).then(function(hasSignedPetition) {
                console.log('checkIfUserSigned function ran successfully', hasSignedPetition);
                if (hasSignedPetition) {
                    res.redirect('/thankyou');
                } else {
                    res.render('petition', {
                        loggedIn: true,
                        csrfToken: req.csrfToken()
                    });
                }
            }).catch(function(err) {
                console.log(err);
            });
        }
    })

    .post( parseForm, csrfProtection, (req, res) => {
        var signUrl = req.body.signUrl;
        if (!signUrl) {
            res.render('petition', {
                loggedIn: true,
                blank: true,
            });
        } else {
            var q = `INSERT INTO user_sign (user_id, signature) VALUES ($1, $2) RETURNING id;`;
            const params = [req.session.user.id, signUrl];
            util.simpleQuery(q, params).then(function() {
                client.del('rows');
                res.redirect('/thankyou');
            }).catch(function(err) {
                console.log(err);
                res.redirect('/petition');
            });
        }
    });


router.route('/thankyou')

    .get( (req, res) => {
        if (!req.session.user) {
            res.redirect('/login');
        } else {
            util.checkIfUserSigned(req.session).then(function(hasSignedPetition) {
                console.log('checkIfUserSigned function ran successfully', hasSignedPetition);
                if (hasSignedPetition) {
                    var q = `SELECT signature, first_name FROM users JOIN user_sign ON users.id = user_sign.user_id WHERE user_id = $1;`;
                    var params = [req.session.user.id];
                    util.simpleQuery(q, params).then(function(result){
                        res.render('thankyou', {
                            loggedIn: true,
                            page: 'Thank you for joining our cause!',
                            url: result.rows[0].signature,
                            name: result.rows[0].first_name
                        });
                    }).catch(function(err) {
                        console.log(err);
                    });
                } else {
                    res.redirect('/petition');
                }
            }).catch(function(err) {
                console.log(err);
            });
        }
    });

router.route('/delete-signature')

    .get( (req, res) => {
        var q = `DELETE FROM user_sign WHERE user_id = $1`;
        const params = [req.session.user.id];
        util.simpleQuery(q, params).then(function() {
            client.del('rows');
            res.redirect('/petition');
        }).catch(function(err) {
            console.log(err);
        });
    });

router.route('/signers')

    .get( (req, res) => {
        if (!req.session.user) {
            res.redirect('/login');
        } else {
            util.checkIfUserSigned(req.session).then(function(hasSignedPetition) {
                if (hasSignedPetition) {
                    client.get('rows', function(err, signerRows) {
                        if (err) {
                            return console.log(err);
                        }
                        if (signerRows != null) {
                            var signers = JSON.parse(signerRows);
                            console.log('the rows were already here', signers);
                            res.render('signers', {
                                loggedIn: true,
                                page: 'Your Fellow Signers',
                                rows: signers,
                            });
                        } else {
                            var q = `SELECT first_name, last_name, age, city FROM user_sign LEFT OUTER JOIN users ON user_sign.user_id = users.id LEFT OUTER JOIN user_profiles ON user_sign.user_id = user_profiles.user_id;`;
                            util.simpleQuery(q, []).then(function(results){
                                var signers = JSON.stringify(results.rows);
                                client.set('rows', `${signers}`, function(err, data) {
                                    if (err) {
                                        return console.log(err);
                                    }
                                    console.log('The rows of signers have been set', data, signers);
                                });
                                res.render('signers', {
                                    loggedIn: true,
                                    page: 'Your Fellow Signers',
                                    rows: results.rows,
                                });
                            }).catch(function(err) {
                                console.log(err);
                            });
                        }
                    });
                } else {
                    res.redirect('/petition');
                }
            }).catch(function(err) {
                console.log(err);
            });
        }
    });

router.route('/signers/:city')

    .get( (req, res) => {
        var city = req.params.city;
        var q = `SELECT first_name, last_name, age FROM user_sign LEFT OUTER JOIN users ON user_sign.user_id = users.id LEFT OUTER JOIN user_profiles ON user_sign.user_id = user_profiles.user_id WHERE city = $1;`;
        const params = [city];
        util.simpleQuery(q, params).then(function(results) {
            res.render('signers', {
                loggedIn: true,
                page: `Your Fellow Signers in ${city}`,
                rows: results.rows,
            });
        }).catch(function(err) {
            console.log(err);
        });
    });




module.exports = router;
