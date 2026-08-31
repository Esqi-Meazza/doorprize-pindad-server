const express = require('express');
const router = express.Router();
const spinController = require('../controllers/SpinController.js');

router.get('/current', spinController.getCurrentState);
router.get('/sessions', spinController.getAllSessions); 
router.post('/start', spinController.startSpin);
router.post('/stop', spinController.stopSpin);
router.post('/respin', spinController.respinSpin);
router.post('/set-session', spinController.setSession); 
router.post('/next', spinController.nextSession);       
router.post('/clear', spinController.clearStage); 

module.exports = router;