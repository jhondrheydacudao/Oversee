/*

PROPRIETARY RIGHTS NOTICE

THIS SOFTWARE PRODUCT IS THE PROPRIETARY PROPERTY OF HYDREN, 
149 NEW MONTGOMERY ST 4TH FLOOR, SAN FRANCISCO, CA 94105, UNITED STATES ("HYDREN, INC.").

ALL RIGHT, TITLE, AND INTEREST IN AND TO THIS SOFTWARE PRODUCT AND ANY 
AND ALL COPIES THEREOF, INCLUDING BUT NOT LIMITED TO ALL INTELLECTUAL 
PROPERTY RIGHTS, ARE AND SHALL REMAIN THE EXCLUSIVE PROPERTY OF OWNER.

THIS SOFTWARE PRODUCT IS PROTECTED BY COPYRIGHT LAWS AND INTERNATIONAL 
COPYRIGHT TREATIES, AS WELL AS OTHER INTELLECTUAL PROPERTY LAWS AND 
TREATIES.

UNAUTHORIZED REPRODUCTION, DISPLAY, DISTRIBUTION, OR USE OF THIS SOFTWARE 
PRODUCT OR ANY PORTION THEREOF MAY RESULT IN SEVERE CIVIL AND CRIMINAL 
PENALTIES, AND WILL BE PROSECUTED TO THE MAXIMUM EXTENT POSSIBLE UNDER LAW.

© 2025 Hydren, INC. ALL RIGHTS RESERVED.

*/ 

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const CatLoggr = require('cat-loggr');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const chalk = require('chalk');
const expressWs = require('express-ws');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { db } = require('./handlers/db.js');
const { init } = require('./handlers/init.js');
const theme = require('./storage/theme.json');
const sqlite = require("better-sqlite3");
const SqliteStore = require("better-sqlite3-session-store")(session);

const app = express();
expressWs(app);

const log = new CatLoggr();
const configPath = './config.json';

// Function to update config.json with the correct IP
async function updateConfig() {
    try {
        const response = await axios.get('https://api64.ipify.org?format=json');
        const publicIP = response.data.ip;

        let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config.baseUri = `http://${publicIP}:${config.port}`;
        config.domain = publicIP;

        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        console.log(`✅ Updated config.json with IP: ${publicIP}`);
    } catch (error) {
        console.error('❌ Failed to fetch public IP:', error);
    }
}

// Update the config before starting the server
updateConfig();

const config = require(configPath);
const ascii = fs.readFileSync('./handlers/ascii.txt', 'utf8');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Rate Limiter for security
const postRateLimiter = rateLimit({
  windowMs: 60 * 100,
  max: 6,
  message: 'Too many requests, please try again later'
});

app.use((req, res, next) => {
  if (req.method === 'POST') {
    postRateLimiter(req, res, next);
  } else {
    next();
  }
});

// Session setup
const sessionstorage = new sqlite("sessions.db");
app.use(
  session({
    store: new SqliteStore({
      client: sessionstorage,
      expired: {
        clear: true,
        intervalMs: 9000000
      }
    }),
    secret: "secret",
    resave: true,
    saveUninitialized: true
  })
);

// Middleware
app.use(async (req, res, next) => {
  try {
    const settings = await db.get('settings');
    res.locals.ogTitle = config.ogTitle;
    res.locals.ogDescription = config.ogDescription;
    res.locals.footer = settings.footer;
    res.locals.theme = theme;
    next();
  } catch (error) {
    console.error('Error fetching settings:', error);
    next(error);
  }
});

// Security headers
if (config.mode === 'production') {
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Hydren-Product', 'OverSee');
    res.setHeader('Expires', '5');
    next();
  });

  app.use('/assets', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=1');
    next();
  });
}

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Plugins and routes
const pluginRoutes = require('./plugins/pluginmanager.js');
app.use("/", pluginRoutes);
const pluginDir = path.join(__dirname, 'plugins');
const PluginViewsDir = fs.readdirSync(pluginDir).map(addonName => path.join(pluginDir, addonName, 'views'));
app.set('views', [path.join(__dirname, 'views'), ...PluginViewsDir]);

// Initialize OverSee
init();

// Log ASCII
console.log(chalk.gray(ascii) + chalk.white(`version v${config.version}\n`));

// Load routes dynamically
const routesDir = path.join(__dirname, 'routes');
function loadRoutes(directory) {
  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadRoutes(fullPath);
    } else if (stat.isFile() && path.extname(file) === '.js') {
      const route = require(fullPath);
      expressWs.applyTo(route);
      app.use("/", route);
    }
  });
}
loadRoutes(routesDir);

// Serve static files
app.use(express.static('public'));

// Start the server
app.listen(config.port, () => log.info(`OverSee is listening on ${config.baseUri}`));

// Catch-all route for 404 errors
app.get('*', async function(req, res){
  res.render('errors/404', {
    req,
    name: await db.get('name') || 'OverSee',
    logo: await db.get('logo') || false
  });
});
