const express = require('express');
const multer = require('multer');
const router = new express.Router();
const User = require('../models/user')
const auth = require('../middleware/auth')


router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token })
  } catch (e) {
    res.status(400).send()
  }
})

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
})

router.patch('/users/me', auth, async (req, res) => {
  let updates = Object.keys(req.body);
  let allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: "invalid operations" });
  }
  try {

    // let users = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    let user = req.user;

    updates.forEach((update) => user[update] = req.body[update]);
    await user.save();
    //if we use findByIdAndUpdate it will skip the middleware
    res.status(201).send(user)
  } catch (e) {
    res.status(500).send(e)
  }
})

router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.deleteOne();
    res.send(req.user)
  } catch (e) {
    res.status(500).send(e)
  }
})

router.post('/users', async (req, res) => {
  const user = new User(req.body);
  const token = await user.generateAuthToken();
  user.save().then(() => {
    res.status(201).send({ user, token })
  }).catch((e) => {
    res.status(400).send(e)
  })
})

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token != req.token);
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
})

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
})

const storage = multer.memoryStorage()
const upload = multer({
  dest: 'avatars',
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
      return cb(new Error('Please upload png,jpeg or jpg image'))
    }
    cb(undefined, true);
  },
  storage
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  req.user.avatar = req.file.buffer;
  await req.user.save();
  res.send()
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    console.log("==get", user)
    if (!user || !user.avatar) {
      throw new Error()
    }
    res.set('Content-Type', 'image/jpg');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send()
  }
})

router.delete('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})


module.exports = router;