var spicedPg = require('spiced-pg');
var dbUrl = process.env.DATABASE_URL || require("./passwords.json").dbUrl; //Variables in all CAPS means they are a constant and won't be changing
var db = spicedPg(dbUrl);
const pwCheck = require('./pwcheck.js');

/*================ FUNCTIONS USED EVERYWHERE ================*/

function simpleQuery(q, params) {
    return new Promise(function(resolve, reject) {
        db.query(q, params).then(function(result) {
            resolve(result);
        }).catch(function(err) {
            reject(err);
        });
    });
}

/*================== REGISTRATION & LOGIN ==================*/

function checkDuplicateEmail(email) {
    return new Promise(function(resolve, reject) {
        var q = `SELECT email_address FROM users;`;
        db.query(q, []).then(function(result) {
            // console.log('inside of db.query', result.rows);
            var isDuplicate = false;
            var data = result.rows;
            for (var i = 0; i < data.length; i++) {
                if (data[i].email_address === email) {
                    isDuplicate = true;
                }
            }
            console.log('Is duplicate:', isDuplicate);
            resolve(isDuplicate);
        }).catch(function(err) {
            reject(err);
        });
    });
}

/*========== SIGNING PETITION & SEEING SIGNATURE/SIGNERS ==========*/

function checkIfUserSigned(session) {
    return new Promise(function (resolve, reject) {
        var q = `SELECT * FROM users INNER JOIN user_sign ON users.id = user_sign.user_id WHERE users.id = $1`;
        const params = [session.user.id];
        db.query(q, params).then(function(result) {
            var hasSigned = false;
            var existentSignature = result.rows[0];
            if (existentSignature) {
                hasSigned = true;
            }
            console.log('User has signed: ', hasSigned);
            resolve(hasSigned);
        }).catch(function(err) {
            reject(err);
        });
    });
}

/*========== EDITING THE USER PROFILE & INFORMATION ==========*/

function updateUserProfile(result, body, session) {
    return new Promise(function(resolve, reject) {
        var q;
        var params;
        if (!result.rows[0]) {
            q = `INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4);`;
            params = [session.user.id, body.age, body.city, body.homepage];
        } else {
            q = `UPDATE user_profiles SET age = $1, city = $2, url = $3 WHERE user_id = $4;`;
            params = [body.age, body.city, body.homepage, session.user.id];
        }
        db.query(q, params).then(function(result) {
            resolve(result);
        }).catch(function(err) {
            reject(err);
        });
    });
}

function updateUserInfo(body, session) {
    return new Promise(function(resolve, reject) {
        var q = '';
        var params;
        if (body.pw != '') {
            pwCheck.hashPassword(body.pw).then(function(hashedPw) {
                q = `UPDATE users SET first_name = $1, last_name = $2, email_address = $3, hashed_pw = $4 WHERE users.id = $5;`;
                params = [body.first, body.second, body.email, hashedPw, session.user.id];
                db.query(q, params).then(function(result) {
                    resolve(result);
                }).catch(function(err) {
                    reject(err);
                });
            }).catch(function(err) {
                reject(err);
            });
        } else {
            q = `UPDATE users SET first_name = $1, last_name = $2, email_address = $3 WHERE users.id = $4;`;
            params = [body.first, body.second, body.email, session.user.id];
            db.query(q, params).then(function(result) {
                resolve(result);
            }).catch(function(err) {
                reject(err);
            });
        }
    });
}


/*========================= EXPORTS =========================*/

module.exports.simpleQuery = simpleQuery;
module.exports.updateUserProfile = updateUserProfile;
module.exports.updateUserInfo = updateUserInfo;
module.exports.checkDuplicateEmail = checkDuplicateEmail;
module.exports.checkIfUserSigned = checkIfUserSigned;
