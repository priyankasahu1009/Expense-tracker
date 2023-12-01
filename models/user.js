const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

const usermodel = new mongoose.Schema(
    {
        username: String,
        password: String,
        email: String,
        token: {
            type: Number,
            default: -1,
        },
        expenses:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:'expense'
           }]
    },
    
    
);

usermodel.plugin(plm);

module.exports = mongoose.model("user", usermodel);
