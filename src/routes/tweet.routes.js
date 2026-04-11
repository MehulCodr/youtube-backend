import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

//why patch and delete chained together? because they both operate on the same resource (tweet) and it makes sense to group them together. It also makes the code cleaner and more organized. If we had separate routes for patch and delete, it would be more verbose and less intuitive.
//how to know which will be called when we hit the endpoint? it depends on the HTTP method used in the request. If we send a PATCH request to /:tweetId, the updateTweet function will be called. If we send a DELETE request to /:tweetId, the deleteTweet function will be called. The router will automatically route the request to the correct handler based on the HTTP method used.

export default router