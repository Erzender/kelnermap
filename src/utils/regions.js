const moment = require("moment");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const data = require("../_model");
const regions = require("../../config/regionInfo.json");

moment.locale("fr");
const getDateFormatted = (date) => moment(date).format("dddd D MMMM à LT");

exports.getDateFormatted = getDateFormatted;

exports.getWar = async () => {
  const battle = await data.Battle.findOne({
    where: { status: "initialized" },
  });
  return battle
    ? {
        stronghold: {
          x: parseInt(battle.dataValues.stronghold.split(" X")[0]),
          z: parseInt(
            battle.dataValues.stronghold.split(" Z")[0].split("| ")[2]
          ),
        },
        date: getDateFormatted(battle.dataValues.date),
      }
    : null;
};

exports.getLeaderBoard = async () => {
  let players = await data.Player.findAll({
    include: [
      {
        model: data.Nation,
        as: "Identity",
      },
    ],
  });
  let leaderBoard = players
    .map((player) => ({
      id: player.dataValues.id,
      picture:
        player.dataValues.picture !== null && player.dataValues.picture.length
          ? player.dataValues.picture
          : "/lekelner/asset/Alex.webp",
      desc: player.dataValues.desc,
      name: player.dataValues.minecraft,
      reputation: player.dataValues.reputation,
      nation: player.Identity && player.Identity.dataValues.pic,
      nationId: player.Identity && player.Identity.dataValues.id,
    }))
    .sort((p1, p2) => p2.reputation - p1.reputation);
  return leaderBoard;
};

exports.getRegionActivity = async () => {
  let ret = regions;
  let keys = Object.keys(regions);
  let edifices = await data.Edificio.findAll({
    where: { region: { [Op.in]: keys } },
  });
  let arts = await data.Art.findAll({
    include: [
      {
        model: data.Edificio,
        as: "Place",
        where: { region: { [Op.in]: keys } },
      },
    ],
  });

  keys.forEach((key) => {
    ret[key].edifices = edifices.filter((elem) => elem.region === key).length;
    ret[key].arts = arts.filter(
      (elem) => elem.Place.dataValues.region === key
    ).length;
  });
  keys.forEach((key) => {
    if (regions[key].suze) {
      ret[regions[key].suze].edifices =
        ret[regions[key].suze].edifices + ret[key].edifices;
      ret[regions[key].suze].arts = ret[regions[key].suze].arts + ret[key].arts;
    }
  });

  return ret;
};
