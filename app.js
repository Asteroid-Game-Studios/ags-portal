const express = require('express');
const session = require('express-session');
const passport = require('passport');
const expressLayouts = require('express-ejs-layouts');
const DiscordStrategy = require('passport-discord').Strategy;
const cookieParser = require('cookie-parser');
const path = require('path');
const connectMongo = require('./lib/mongo');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: process.env.NEXTAUTH_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));


app.use(passport.initialize());
app.use(passport.session());

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_REDIRECT_URI,
    scope: ['identify', 'guilds', 'connections']
}, (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});


const indexRoute = require('./routes/index');
const dashboardRoute = require('./routes/dashboard');
const authRoute = require('./routes/auth/discord');
const apiRoute = require('./routes/api');
const apiUsersRoute = require('./routes/api/users');


app.use('/', indexRoute);
app.use('/dashboard', dashboardRoute);
app.use('/auth', authRoute);
app.use('/api', apiRoute);
app.use('/api/users', apiUsersRoute);



app.get('/2fa', (req, res) => {
    if (!req.user) {
        return res.redirect('/');
    }
    res.render('2fa', {
        title: '2FA Verification | Asteroid Studios',
        user: req.user,
        error: req.query.error
    });
});

app.get('/2fa-error', (req, res) => {
    if (!req.user) {
        return res.redirect('/');
    }
    res.render('2fa-error', {
        title: '2FA Error | Asteroid Studios',
        user: req.user
    });
});

app.get('/dms-closed', (req, res) => {
    if (!req.user) {
        return res.redirect('/');
    }
    res.render('dms-closed', {
        title: 'Enable Discord DMs | Asteroid Studios',
        user: req.user
    });
});


app.use('/', indexRoute);
app.use('/dashboard', dashboardRoute);
app.use('/api/auth', authRoute);



app.listen(process.env.PORT || 3001, () => {
    const port = process.env.PORT || 3001;
    console.log(`Server running on port ${port}`);

    const os = require('os');
    const networkInterfaces = os.networkInterfaces();

    console.log('\n===== Server URLs =====');
    console.log(`Local: http://localhost:${port}`);

    Object.keys(networkInterfaces).forEach(interfaceName => {
        const interfaces = networkInterfaces[interfaceName];
        interfaces.forEach(iface => {
            if (!iface.internal && iface.family === 'IPv4') {
                console.log(`Network: http://${iface.address}:${port}`);
            }
        });
    });
    console.log('=======================\n');
});

connectMongo();