import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

//login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }
        const token = createToken(user._id);
        res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error logging in user" });

    }
};

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
};

//register user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    //check if user exist
    const exist = await userModel.findOne({ email });
    if (exist) {
      return res.json({ success: false, message: "User already exist" });
    }
    //validate email and password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "please enter a valid email",
      });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "please enter a strong password",
      });
    }

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create user
    const user = new userModel({
      name: name,
      email: email,
      password: hashedPassword,
    });

    const savedUser = await user.save();
    const token = createToken(savedUser._id);
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error registering user",
    });
  }
};

export { loginUser, registerUser };
