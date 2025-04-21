const express = require('express');
const session = require('express-session');
const passport = require('passport');
const expressLayouts = require('express-ejs-layouts');
const DiscordStrategy = require('passport-discord').Strategy;
const cookieParser = require('cookie-parser');
const path = require('path');
const MongoStore = require('connect-mongo');
const { connectToDatabase } = require('./lib/mongo');

const { retrieveAccessToken, fetchUserProfile } = require('./lib/auth');
require('dotenv').config();

const app = express();


connectToDatabase().then(() => {
    console.log('MongoDB connection established, setting up application...');

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
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        },
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            ttl: 24 * 60 * 60
        })
    }));


    app.use(passport.initialize());
    app.use(passport.session());

    app.use('/api/auth/discord', (req, res, next) => {
        req.logout((err) => {
            if (err) console.error('Error during logout:', err);
            req.session.destroy((err) => {
                if (err) console.error('Error destroying session:', err);
                next();
            });
        });
    });

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
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const accessToken = await retrieveAccessToken(id);
            if (!accessToken) {
                return done(null, false);
            }

            const profile = await fetchUserProfile(id, accessToken);
            if (!profile) {
                return done(null, false);
            }

            done(null, profile);
        } catch (error) {
            console.error('Error deserializing user:', error);
            done(error, null);
        }
    });


    const indexRoute = require('./routes/index');
    const dashboardRoute = require('./routes/dashboard');
    const authRoute = require('./routes/auth/discord');
    const apiRoute = require('./routes/api');
    const apiUsersRoute = require('./routes/api/users');
    const docsRoute = require('./routes/docs');
    const meetingsRoute = require('./routes/meetings');
    const tasksRoute = require('./routes/tasks');


    app.use('/', indexRoute);
    app.use('/dashboard', dashboardRoute);
    app.use('/auth', authRoute);
    app.use('/api/auth', authRoute);
    app.use('/api', apiRoute);
    app.use('/api/users', apiUsersRoute);
    app.use('/docs', docsRoute);
    app.use('/docs/overview', docsRoute);
    app.use('/docs/rblx-studio', docsRoute);
    app.use('/docs/moderation', docsRoute);
    app.use('/meetings', meetingsRoute);
    app.use('/tasks', tasksRoute)

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



    app.use((req, res) => {
        console.log(`404 - Not Found: ${req.originalUrl}`);
        res.status(404).send('Not Found');
    });


    app.listen(process.env.PORT || 3001, () => {
        const port = process.env.PORT || 3001;
        console.log(`Server running on port ${port}`);
    });
}).catch(err => {
    console.error('Failed to start application due to database connection error:', err);
});
