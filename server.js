const express = require('express');
const app = express();

const chalk = require('chalk');

var hb = require('express-handlebars');
app.engine('handlebars', hb({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 8080);
app.use(require('cookie-parser')());
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

/*var cookieSession = require('cookie-session');
app.use(cookieSession({
    secret: 'MonkEys eat BanANas!',
    maxAge: 1000 * 60 * 60
}));*/

var session = require('express-session');
var Store = require('connect-redis')(session);
app.use(session({
    store: new Store({
        //ttl: 3600,
        //host: 'localhost',
        port: 6379,
        url: "redis://h:p9c7f1a8c606baa550497b0f95a8a071deacfeabed392aa2f6c4c1785042d10f6@ec2-34-250-146-11.eu-west-1.compute.amazonaws.com:21149"
    }),
    resave: false,
    saveUninitialized: true,
    secret: 'my super fun secret'
}));

app.use(express.static(__dirname + '/public'));

app.use('/', require('./routes/profileRoutes.js'));
app.use('/', require('./routes/petitionRoutes.js'));
app.use('/', require('./routes/loginRoutes.js'));

app.route('/')

    .get( (req, res) => {
        if (!req.session.user) {
            res.redirect('/registration');
        } else {
            res.redirect('/thankyou');
        }
    });

app.listen(app.get('port'), function() {
    console.log(chalk.bgMagenta('Listening.'));
});
