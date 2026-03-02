const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const admin = require('../config/firebase');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { token } = req.body; 

  if (!token) {
    res.status(400);
    throw new Error('Firebase ID Token is required');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name, picture } = decodedToken;

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Link existing user
        user.firebaseUid = uid;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
           name: name || email.split('@')[0],
           email,
           password: 'firebase_auth_user', // Dummy password
           firebaseUid: uid,
        });
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: token
    });

  } catch (error) {
    console.error(error);
    res.status(401);
    throw new Error('Invalid Firebase Token');
  }
});

module.exports = {
  authUser,
};
