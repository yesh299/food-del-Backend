import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const normalizeStripeKey = (rawKey = "") => {
  // Trim whitespace and optional wrapping quotes from hosting env values.
  return String(rawKey).trim().replace(/^['\"]|['\"]$/g, "");
};

const getStripeClient = () => {
  const stripeKey = normalizeStripeKey(
    process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY,
  );

  if (!stripeKey) {
    throw new Error("Stripe key is missing on server");
  }

  if (stripeKey.startsWith("pk_")) {
    throw new Error(
      "You are using a Stripe public key as secret. Put pk_* in STRIPE_PUBLISHABLE_KEY and set STRIPE_SECRET_KEY to sk_*",
    );
  }

  if (!stripeKey.startsWith("sk_")) {
    throw new Error(
      "Stripe secret key is invalid. Use a key that starts with sk_",
    );
  }

  return new Stripe(stripeKey);
};

// placing user order from frontend
const placeOrder = async (req, res) => {
  const frontend_url =
    process.env.FRONTEND_URL || "https://food-del-ten-blue.vercel.app";

  try {
    const userId = req.body.userId;
    const items = req.body.items || req.body.Items || req.body.cartItems || [];

    if (!userId) {
      return res.json({ success: false, message: "User not authorized" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    let stripe;
    try {
      stripe = getStripeClient();
    } catch (stripeConfigError) {
      return res.json({
        success: false,
        message: stripeConfigError.message,
      });
    }

    const newOrder = new orderModel({
      // add new item in the database
      userId,
      items,
      amount: req.body.amount,
      address: req.body.address,
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} }); // cleaning the user cart data from this line

    const line_Items = items.map((item) => ({
      //for stripe payment
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(Number(item.price) * 100 * 80),
      },
      quantity: item.quantity,
    }));

    line_Items.push({
      //delivery charges
      price_data: {
        currency: "inr",
        product_data: {
          name: "Delivery Fee",
        },
        unit_amount: 2 * 100 * 80,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      line_items: line_Items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderid=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderid=${newOrder._id}`,
    });

    return res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message || "error" });
  }
};

const verifyOrder = async (req, res) => {
  const { success, orderId } = req.body;
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Payment successful" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const usersOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// listing orders foe admin panel
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

//api for updating order status
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.body.orderId || req.body.orderID || req.body._id;
    const status = req.body.status;

    if (!orderId) {
      return res.json({
        success: false,
        message: "orderId is required",
      });
    }

    if (!status) {
      return res.json({
        success: false,
        message: "status is required",
      });
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({ success: true, message: "Status Updated", data: updatedOrder });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { placeOrder, verifyOrder, usersOrders, listOrders, updateOrderStatus };
