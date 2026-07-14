const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const credentialController = require('../controllers/credentialController');

const router = express.Router();

router.use(requireAdmin);

router.patch('/:credId/revoke', credentialController.revokeCredential);
router.delete('/:credId', credentialController.deleteCredential);

module.exports = router;
