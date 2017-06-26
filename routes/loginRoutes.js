var express = require('express'), router = express.Router();
const pwCheck = require('../config/pwcheck.js');
const util = require('../config/utilities.js');

var bodyParser = require('body-parser');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var parseForm = bodyParser.urlencoded({ extended: false });


router.route('/registration')

    .get( csrfProtection, (req, res) => {
        if (!req.session.user) {
            res.render('registration', {
                csrfToken: req.csrfToken(),
                page: 'Registration',
                loggedOut: true
            });
        }
    })

    .post( parseForm, csrfProtection, (req, res) => {
        if (!req.body.first || !req.body.second || !req.body.email || !req.body.pw) {
            res.render('registration', {
                loggedOut: true,
                blank: true
            });
        } else {
            console.log('about to run checkDuplicateEmail');
            util.checkDuplicateEmail(req.body.email).then(function(isDuplicateEmail) {
                console.log('checkDuplicateEmail successfully ran', isDuplicateEmail);
                if (isDuplicateEmail) {
                    res.render('registration', {
                        loggedOut: true,
                        usedEmail: true,
                        badEmail: req.body.email
                    });
                } else {
                    pwCheck.hashPassword(req.body.pw).then(function(hashedPw) {
                        var q = `INSERT INTO users (first_name, last_name, email_address, hashed_pw) VALUES ($1, $2, $3, $4);`;
                        const params = [req.body.first, req.body.second, req.body.email, hashedPw];
                        util.simpleQuery(q, params).then(function() {
                            res.redirect('/login');
                        }).catch(function(err) {
                            console.log(err);
                            res.redirect('/registration');
                        });
                    }).catch(function(err) {
                        console.log('ERROR',err);
                        res.redirect('/registration');
                    });
                }
            });
        }
    });


router.route('/login')

    .get( csrfProtection, (req, res) => {
        if (!req.session.user) {
            res.render('login', {
                page: 'Login',
                loggedOut: true,
                csrfToken: req.csrfToken()
            });
        }
    })

    .post( parseForm, csrfProtection, (req, res) => {
        if (!req.body.email || !req.body.pw) {
            res.render('login', {
                loggedOut: true,
                blank: true
            });
        }
        util.checkDuplicateEmail(req.body.email).then(function(isDuplicateEmail) {
            if (!isDuplicateEmail) {
                res.render('login', {
                    loggedOut: true,
                    emailError: true
                });
            } else {
                var q = `SELECT * FROM users WHERE email_address = $1;`;
                const params = [req.body.email];
                util.simpleQuery(q, params).then(function(result) {
                    var userObj = {
                        firstName: result.rows[0].first_name,
                        lastName: result.rows[0].last_name,
                        id: result.rows[0].id,
                    };
                    var comparePw = result.rows[0].hashed_pw;
                    pwCheck.checkPassword(req.body.pw, comparePw).then(function(match) {
                        if (match === true) {
                            req.session.user = userObj;
                            res.redirect('/petition');
                        } else {
                            res.render('login', {
                                loggedOut: true,
                                wrongPw: true
                            });
                        }
                    }).catch(function(err) {
                        console.log(err);
                        res.redirect('/login');
                    });
                }).catch(function(err) {
                    console.log(err);
                    res.redirect('/login');
                });
            }
        });
    });


router.route('/logout')

    .get( (req, res) => {
        //req.session = null;
        req.session.destroy();
        res.redirect('/registration');
    });



module.exports = router;
