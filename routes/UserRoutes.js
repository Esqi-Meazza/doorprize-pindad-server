const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyUserToken = require('../middlewares/verifyUserToken');

router.get('/divisi', userController.getDivisi);
router.post('/checkin', userController.checkIn);
router.post('/autofill', userController.autofill);
router.post('/logout', verifyUserToken, userController.logout);
router.get('/active', userController.getActive);

module.exports = router;