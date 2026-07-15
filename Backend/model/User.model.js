import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            minlength: 6,
        },
        gender: {
            type: String,
            default: "",
        },
        profilePic: {
            type: String,
        },

        nativeLanguage: {
            type: String,
            default: "",
        },

        learningLanguage: {
            type: String,
            default: "",
        },

        isOnboarded: {
            type: Boolean,
            default: false,
        },

        friends: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
    },
    {
        timestamps: true
    }
);


userSchema.pre("save", async (next) => {
    if (!this.isModified("password")) {
        next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});



userSchema.methods.matchPassword = async (enteredPassword) => {
    return await bcrypt.compare(enteredPassword, this.password);
}
const User = mongoose.model("User", userSchema);
export default User;