const {Router} = require("express");
const {getMetrics} = require("../controllers/metrics.controller");
// const { naturalLanguageQuery } = require("../controllers/nl.controller");

const router = Router();

router.get("/metrics", getMetrics);
// router.get('/nl',naturalLanguageQuery)

module.exports = router;