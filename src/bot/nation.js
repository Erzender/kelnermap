const Discord = require("discord.js");
const data = require("../_model");
const checkIsNationCitizen = require("../utils/citizenship")
  .checkIsNationCitizen;
const strongholdUpdate = require("../utils/stronghold").update;

exports.fonder = async (client, message, args, player) => {
  if (args.length < 3) {
    return message.channel.send("Pas compris.");
  }
  if (player.Identity !== null) {
    return message.channel.send("T'as déjà une nation fdp.");
  }
  let nation = null;
  try {
    nation = await data.Nation.create({ name: args[2] });
    await player.addCitizenship(nation);
    await player.setIdentity(nation);
  } catch (err) {
    console.log(err);
    return message.channel.send("Le Kelner.exe a cessé de fonctionner.");
  }
  client.channels
    .get(JSON.parse(process.env.KELNER_BOT).channel)
    .send(
      "<@" +
        message.author.id +
        "> a chié une nation nouvelle : " +
        nation.dataValues.name +
        "."
    );
  voir(
    client,
    message,
    [null, null, (await player.getIdentity()).dataValues.id],
    player
  );
};

exports.brexit = async (client, message, args, player) => {
  if (player.Identity === null) {
    return message.channel.send("Vous brexitez.");
  }
  let citizens = null;
  try {
    citizens = await data.Player.findAll({
      include: {
        model: data.Nation,
        as: "Citizenship",
        where: { id: player.Identity.dataValues.id }
      }
    });
  } catch (err) {
    console.log(err);
  }
  if (
    Object.keys(citizens).length <= 1 &&
    args.length < 3 &&
    args[2] !== "--force"
  ) {
    return message.channel.send(
      "Déso mais t'es le dernier, ça va supprimer la nation, faut faire `$nation brexit --force`."
    );
  }
  if (Object.keys(citizens).length <= 1) {
    let name = player.Identity.dataValues.name;
    await player.Identity.destroy();
    client.channels
      .get(JSON.parse(process.env.KELNER_BOT).channel)
      .send(
        "C'est la fin de la grande nation qu'était " +
          name +
          ". Puisse l'oubli l'accueillir durablement."
      );
  }
  await player.setIdentity(null);
  message.channel.send(
    "Et hop, vous êtes apatride <@" + message.author.id + ">."
  );
};

const voir = async (client, message, args, player) => {
  if (args.length < 3) {
    return message.channel.send("T'as pas dit quelle nation.");
  }
  const nation = await data.Nation.findByPk(args[2]);
  if (nation === null) {
    return message.channel.send("Connais pas.");
  }
  const citizens = await data.Player.findAll({
    include: [
      {
        model: data.Nation,
        as: "Citizenship",
        where: { id: nation.dataValues.id }
      },
      {
        model: data.Nation,
        as: "Identity",
        where: { id: nation.dataValues.id }
      }
    ]
  });
  const embed = new Discord.RichEmbed()
    .setColor(nation.dataValues.color)
    .setAuthor(nation.dataValues.name)
    .setDescription(nation.dataValues.desc)
    .setThumbnail(nation.dataValues.pic)
    .addField("ID", nation.dataValues.id)
    .addField("Réputation disponible", nation.dataValues.reputationPool)
    .addField("Bastion", nation.dataValues.stronghold);
  if (citizens.length > 0) {
    embed.addField(
      "Citoyens",
      Object.keys(citizens)
        .map(i => message.guild.members.get(citizens[i].dataValues.discord))
        .reduce((prev, citizen) => prev + ", " + citizen)
    );
  }
  message.channel.send(embed);
};

exports.voir = voir;

exports.changer = async (client, message, args, player) => {
  if (args.length < 4) {
    return message.channel.send("Pas compris.");
  }
  if (!checkIsNationCitizen(player)) {
    return message.channel.send("You have no power here.");
  }
  try {
    if (args[2] === "couleur" && /^#(?:[0-9a-f]{3}){1,2}$/i.test(args[3])) {
      await player.dataValues.Identity.update({ color: args[3] });
    } else if (args[2] === "nom") {
      await player.dataValues.Identity.update({ name: args[3] });
    } else if (args[2] === "image") {
      await player.dataValues.Identity.update({ pic: args[3] });
    } else if (args[2] == "description") {
      await player.dataValues.Identity.update({ desc: args[3] });
    } else if (args[2] == "bastion") {
      if (args.length < 6) {
        return message.channel.send(
          "Il faut 3 coordonnées (X, Y, Z).\n`$nation changer bastion 1 2 3`"
        );
      }
      console.log(args[3]);
      await player.dataValues.Identity.update({
        stronghold:
          parseInt(args[3]) +
          " X | " +
          parseInt(args[4]) +
          " Y | " +
          parseInt(args[5]) +
          " Z"
      });
    } else {
      return message.channel.send("Pas compris.");
    }
  } catch (err) {
    console.log(err);
    return message.channel.send("Le Kelner.exe a cessé de fonctionner.");
  }
  voir(
    client,
    message,
    [null, null, player.dataValues.Identity.dataValues.id],
    player
  );
  message.channel.send("Voilà voilà.");
};

exports.lister = async (client, message, args, player) => {
  let nations = await data.Nation.findAll();
  let format = Object.keys(nations)
    .map(i => ({
      id: nations[i].dataValues.id,
      name: nations[i].dataValues.name
    }))
    .reduce((prev, next) => prev + "\n" + next.name + " (" + next.id + ")", "");
  const embed = new Discord.RichEmbed()
    .setTitle("Nations")
    .setDescription(format);
  message.channel.send(embed);
};

exports.naturaliser = async (client, message, args, player) => {
  if (args.length < 3) {
    return message.channel.send("Pas compris.");
  }
  if (!checkIsNationCitizen(player)) {
    return message.channel.send("You have no power here.");
  }
  let targetPlayer = await data.Player.findByPk(args[2]);
  if (targetPlayer === null) {
    return message.channel.send("Joueur inconnu.");
  }
  await targetPlayer.addCitizenship(player.Identity);
  message.channel.send(
    "<@" +
      args[2] +
      "> peut désormais obtenir la nationalité de **" +
      player.Identity.dataValues.name +
      "**"
  );
};

exports.radier = async (client, message, args, player) => {
  if (args.length < 3) {
    return message.channel.send("Pas compris.");
  }
  if (!checkIsNationCitizen(player)) {
    return message.channel.send("You have no power here.");
  }
  if (args[2] === player.dataValues.discord) {
    return message.channel.send(
      "Nan ça c'est toi, essaye avec `$nation brexit`"
    );
  }
  let targetPlayer = await data.Player.findByPk(args[2]);
  if (targetPlayer === null) {
    return message.channel.send("Joueur inconnu.");
  }
  await targetPlayer.removeCitizenship(player.Identity);
  message.channel.send(
    "<@" +
      args[2] +
      "> n'est plus citoyen de **" +
      player.Identity.dataValues.name +
      "**"
  );
};