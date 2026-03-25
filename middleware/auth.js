import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const tokenHeader = req.headers.token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : "";
    const bodyToken = req.body?.token;
    const queryToken = req.query?.token;
    const token = tokenHeader || bearerToken || bodyToken || queryToken;

    if (!token) {
        return res.json({success: false, message: "Not Authorized Login Again"});
    }

    try {
        const token_decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.body = req.body || {};
        req.body.userId = token_decoded.id;
        next();
    } catch (error) {
        return res.json({success: false, message: "Invalid Token"});
    }

}


export default authMiddleware;