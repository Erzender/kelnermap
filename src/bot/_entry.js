const Discord = require("discord.js");
const data = require("../_model");
const client = new Discord.Client();

const commands = {
  $profil: require("./profile"),
  $nation: require("./nation"),
  $région: require("./region")
};

client.on("ready", () => {
  console.log("Ready!");
});

try {
  client.on("message", message => {
    processBotMessage(message);
  });
} catch (err) {
  console.log(err);
}

client.on("disconnect", () => {
  setTimeout(() => {
    try {
      client.login(JSON.parse(process.env.KELNER_BOT).id);
    } catch (err) {
      console.log(err);
    }
  }, 60000);
});

exports.client = client;

const processBotMessage = message => {
  if (
    !(
      message.channel.id === JSON.parse(process.env.KELNER_BOT).channel &&
      message.channel.guild.id === JSON.parse(process.env.KELNER_BOT).guild &&
      message.content.length > 0 &&
      message.content[0] === "$"
    )
  ) {
    return null;
  }
  let rawargs = message.content.split(" ");
  let args = [];
  let complexArgPos = -1;
  rawargs.forEach((arg, i) => {
    if (arg[0] === '"' && complexArgPos < 0) {
      complexArgPos = i;
    }
    if (arg[arg.length - 1] === '"' && complexArgPos > 0) {
      let concat = rawargs
        .slice(complexArgPos, i + 1)
        .reduce((acc, val) => acc + " " + val);
      args.push(concat.slice(1, concat.length - 1));
      return (complexArgPos = -1);
    }
    if (complexArgPos < 0) {
      return args.push(arg);
    }
    if (i >= rawargs.length - 1) {
      args = args.concat(rawargs.slice(complexArgPos, i + 1));
    }
  });
  console.log(args);
  processCommand(client, message, args);
};

const processCommand = async (client, message, args) => {
  if (args.length >= 2 && commands[args[0]] && commands[args[0]][args[1]]) {
    let player = await data.Player.findByPk(message.author.id, {
      include: [
        {
          model: data.Nation,
          as: "Identity"
        },
        { model: data.Nation, as: "Citizenship" }
      ]
    });
    if (player === null) {
      try {
        player = await data.Player.create({ discord: message.author.id });
        return message.channel.send(
          "T'étais comme le ç de surf, maintenant c'est bon recommence stp."
        );
      } catch (err) {
        console.log(err);
        return message.channel.send("Le Kelner.exe a cessé de fonctionner.");
      }
    }
    commands[args[0]][args[1]](client, message, args, player);
  } else {
    return message.channel.send("Cette commande n'existe papapapapa.");
  }
};