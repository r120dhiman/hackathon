const {Router} = require("express");
const { allUsers, newUser } = require("../controllers/user.controller");
const userRouter= Router();


userRouter.get("/users", allUsers);
userRouter.post("/user", newUser);

module.exports = userRouter;