import mongoose,  {Schema} from 'mongoose';

const subscriptionSchema = new Schema({
    subscriber : { // the user who is subscribing
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
    },

    channel : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
}, {
    timestamps : true
})

export const Subscription = mongoose.model("subscription" , subscriptionSchema)