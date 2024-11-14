// controllers/googleAuthController.js
const { OAuth2Client } = require('google-auth-library');
const message = require("../modules/message");
const jwt = require('jsonwebtoken');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET; // Make sure this is set in your environment variables

exports.googleSignIn = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email } = payload;

    // Check if the user exists in the database
    const user = await message.findOne({ e_mail: email });

    if (!user) {
      // If the user doesn't exist, return an error
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }

    // If the user exists, generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.e_mail, userType: user.user_type },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: "Google Sign-In successful",
      token: jwtToken,
      user: {
        id: user._id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.e_mail,
        mobileNumber: user.mobile_number,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(400).json({
      success: false,
      message: "Invalid Google token",
    });
  }
};