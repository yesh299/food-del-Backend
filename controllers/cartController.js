import userModel from "../models/userModel.js";

// Add items to user's cart
const addToCart = async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    if (!itemId) {
      return res.json({ success: false, message: "Item ID is required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const cartData = user.cartData || {};
    cartData[itemId] = (cartData[itemId] || 0) + 1;

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

//remove item from user cart
const removeFromCart = async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    if (!itemId) {
      return res.json({ success: false, message: "Item ID is required" });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    const cartData = userData.cartData || {};
    if (cartData[itemId] > 0) {
      cartData[itemId] -= 1;
      if (cartData[itemId] <= 0) {
        delete cartData[itemId];
      }
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

//fetch user cart data
const getCart = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, cartData: user.cartData || {} });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { addToCart, removeFromCart, getCart };
