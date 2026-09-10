const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyUserToken = require('../middlewares/verifyUserToken');
const validate = require('../middlewares/validate');
const { participantCredentialsSchema, userLogoutSchema } = require('../schemas/requestSchemas');

router.get('/divisi', userController.getDivisi);
router.post('/checkin', validate(participantCredentialsSchema), userController.checkIn);
router.post('/autofill', validate(participantCredentialsSchema), userController.autofill);
router.post('/logout', verifyUserToken, validate(userLogoutSchema), userController.logout);
router.get('/active', userController.getActive);

module.exports = router;