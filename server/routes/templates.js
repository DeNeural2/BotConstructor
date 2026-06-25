const router = require('express').Router();
const auth = require('../middleware/auth');
const Template = require('../models/Template');

router.use(auth);

router.get('/', async (req, res) => {
  const templates = await Template.find({});
  res.json(templates);
});

router.get('/:id', async (req, res) => {
  const template = await Template.findById(req.params.id);
  if (!template) return res.status(404).json({ message: 'Not found' });
  res.json(template);
});

module.exports = router;
