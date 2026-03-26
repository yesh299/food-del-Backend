import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// placing user order from frontend
const placeOrder = async (req, res) => {

    const frontend_url = "https://food-del-ten-blue.vercel.app" //frontend

    try {
        const newOrder = new orderModel({ // add new item in the database
            userId: req.user._id,
            items: req.body.cartItems,
            amount: req.body.amount,
            address: req.body.address,
        });
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.user._id, {cartData: {}}); // cleaning the user cart data from this line 

        const line_Items = req.body.Items.map((item) => ({ //for stripe paymenet
            price_data: {
                currency: "inr",
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100*80
            },
            quantity: item.quantity
        }));

        line_Items.push({ //delivery charges
            price_data: {
                currency: "inr",
                product_data: {
                    name: "Delivery Fee"
                },
                unit_amount:  2*100*80
            },
            quantity: 1
        });

        const session = await stripe.checkout.sessions.create({
            line_items: line_Items,
            mode: "payment",
            success_url: `${frontend_url}/verify?success=true&orderid=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=true&orderid=${newOrder._id}`,
        })

        res.json({success:true,session_url:session.url})

    } catch (error) {
        console.log(error);
        res.json ({success:false,message:"error"})
        
    }
};


export { placeOrder };