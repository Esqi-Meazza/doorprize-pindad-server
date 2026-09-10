const express = require('express');
const router = express.Router();
const spinController = require('../controllers/SpinController.js');
const validate = require('../middlewares/validate');
const { spinSessionSchema, spinActionSchema } = require('../schemas/requestSchemas');

router.get('/current', spinController.getCurrentState);
router.get('/sessions', spinController.getAllSessions);
router.post('/start', validate(spinSessionSchema), spinController.startSpin);
router.post('/stop', validate(spinActionSchema), spinController.stopSpin);
router.post('/respin', validate(spinSessionSchema), spinController.respinSpin);
router.post('/set-session', validate(spinSessionSchema), spinController.setSession);
router.post('/next', validate(spinActionSchema), spinController.nextSession);
router.post('/clear', spinController.clearStage);

module.exports = router;