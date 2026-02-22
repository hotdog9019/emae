
const router = require('express').Router();
const dishes = require('../data/dishes');

router.get('/', (req, res) => {
  const { vegan, halal, glutenFree } = req.query;
  let result = dishes;
  if (vegan === 'true') result = result.filter(d => d.vegan);
  if (halal === 'true') result = result.filter(d => d.halal);
  if (glutenFree === 'true') result = result.filter(d => d.glutenFree);
  res.json(result);
});

module.exports = router;
