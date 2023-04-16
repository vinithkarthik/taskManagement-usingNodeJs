const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const Task = require('./task');

const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error('Email is invalid')
                }
            }
        },
        password: {
            type: String,
            required: true,
            minlength: 7,
            trim: true,
            validate(value) {
                if (value.toLowerCase().includes('password')) {
                    throw new Error('Password cannot contain "password"')
                }
            }
        },
        age: {
            type: Number,
            default: 0,
            validate(value) {
                if (value < 0) {
                    throw new Error('Age must be a postive number')
                }
            }
        },
        tokens: [{
            token: {
                type: String,
                required: true
            }
        }],
        avatar: {
            type: Buffer
        }
    },
    {
        timestamps: true
    }
)

UserSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

UserSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET); //since id is Object is we are converting it to string
    user.tokens = user.tokens.concat({ token });
    await user.save()
    return token;
}

UserSchema.methods.toJSON = function () {
    let user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens

    return userObject;
}

UserSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("unable to login");
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    console.log(isPasswordMatch)
    if (!isPasswordMatch) {
        throw new Error('password mismatch')
    }
    return user;
}

UserSchema.pre('save', async function (next) { //use normal function to make use of 'this'
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next() //used to resume the operation
})

UserSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
})


const User = mongoose.model('User', UserSchema)

module.exports = User