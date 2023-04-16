const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const auth = require('../middleware/auth');

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })
  try {
    await task.save();
    res.status(201).send(task)
  } catch (e) {
    res.status(400).send(e)
  }
})

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id
  try {
    const task = await Task.findOne({ _id, owner: req.user.id })

    if (!task) {
      res.status(404).send({ error: "task not found" })
    }
    res.send(task)
  } catch (e) {
    res.status(500).send()
  }
})

//supports -> /tasks?completed=true, /tasks?completed=false
// -> /tasks?limit=2&skip=2
// -> /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
  try {
    const match = {};
    const sort = {};
    if (req.query.completed) {
      match.completed = req.query.completed == 'true'
    }
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }
    // const tasks = await Task.find({ owner: req.user.id });
    // res.send(tasks);
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }) //we can also retirive task by crating a relationship bw users and task model
    res.send(req.user.tasks)
  } catch (e) {
    res.status(500).send(e);
  }
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).send({ error: 'invalid update' })
  }
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
    if (!task) {
      return res.status(404).send({ error: "not found" });
    }
    updates.forEach(update => task[updates] = req.body[update])
    await task.save()
    res.send(task)
  } catch (e) {
    res.status(400).send({ error: "some error occured" })
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
    if (!task) {
      return res.status(404).send({ error: 'not found' })
    }
    res.send({ msg: "deleted successfully" })
  } catch (e) {
    res.status(400).send({ error: "some error occured" })
  }
})

module.exports = router;