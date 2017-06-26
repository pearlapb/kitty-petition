
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

router.route('/profile')

    .get( csrfProtection, (req, res) => {
        if (req.session.user) {
            res.render('profile', {
                loggedIn: true,
                page: 'Profile',
                csrfToken: req.csrfToken()
            });
        } else {
            res.redirect('/login');
        }
    })

    .post( parseForm, csrfProtection, (req, res) => {
        var q = `INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4);`;
        const params = [req.session.user.id, req.body.age, req.body.city, req.body.homepage];
        util.simpleQuery(q, params).then(function(result) {
            console.log('this worked!', result);
            client.del('rows');
            res.redirect('/thankyou');
        });
    });

router.route('/profile/edit')

    .get( csrfProtection, (req, res) => {
        var q = `SELECT * FROM users FULL OUTER JOIN user_profiles ON users.id = user_profiles.user_id WHERE users.id = $1;`;
        const params = [req.session.user.id];
        util.simpleQuery(q, params).then(function(result) {
            res.render('edit', {
                loggedIn: true,
                rows: result.rows[0],
                csrfToken: req.csrfToken()
            });
        });
    })

    .post ( parseForm, csrfProtection, (req, res) => {
        var q = `SELECT * FROM user_profiles WHERE user_id = $1;`;
        const params = [req.session.user.id];
        util.simpleQuery(q, params).then(function(result) {
            if (!req.body.first || !req.body.second || !req.body.email) {
                res.render('edit', {
                    blank: true,
                    loggedIn: true,
                });
            } else {
                util.updateUserInfo(req.body, req.session).then(function() {
                    util.updateUserProfile(result, req.body, req.session);
                }).then(function() {
                    client.del('rows');
                    console.log('redirecting to same page...');
                    res.redirect('/profile/edit');
                }).catch(function(err) {
                    console.log(err);
                });
            }
        }).catch(function(err) {
            console.log(err);
        });
    });


module.exports = router;
