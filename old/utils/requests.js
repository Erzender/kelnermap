const data = require('../data')

const territory = function(req, res) {
  data.requests.addRequest(
    "TERRITORY", (req.body && req.body.areas)
    ? req.body.areas
    : []).then(result => {
    if (result !== null) {
      return res.json({id: result})
    }
    return res.status(500).send('Internal error.');
  })
}

const caca = function(totest) {
  if (totest === undefined || totest === null) {
    return true
  }
  return false
}

const player = function(req, res) {
  if (!req.body || caca(req.body.name) || caca(req.body.nationName) || caca(req.body.desc) || caca(req.body.color) || caca(req.body.soutiens) || caca(req.body.image)) {
    return res.status(403).send('Wrong arguments');
  }
  data.requests.addRequest(
    "PLAYER", {name: req.body.name, nationName: req.body.nationName, desc: req.body.desc, color: req.body.color, soutiens: req.body.soutiens, image: req.body.image}).then(result => {
    if (result !== null) {
      return res.json({id: result})
    }
    return res.status(500).send('Internal error.');
  })
}

exports.newRequest = function(req, res, type) {
  data.requests.getRequests().then(result => {
    if (result === null) {
      return result.status(500).send('Internal error.');
    }
    if (result.length > 20) {
      return res.status(403).send('We cannot handle more requests.');
    }
    switch (type) {
      case 'territory':
        return territory(req, res)
        break;
      case 'player':
        return player(req, res)
        break;
      default:
        return res.status(404).send('Sorry, what ?');
    }
  })
}
