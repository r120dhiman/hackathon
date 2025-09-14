const {Router} = require("express");
const {getMetrics} = require("../controllers/metrics.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
// const { naturalLanguageQuery } = require("../controllers/nl.controller");

const router = Router();

router.get("/metrics", authenticateToken, getMetrics);
// router.get('/nl',naturalLanguageQuery)

module.exports = router;