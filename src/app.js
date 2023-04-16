const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');
const app = express()

// app.use((req, res) => {
//     res.status(503).send("Maintance in progress")
// })
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

module.exports = app;