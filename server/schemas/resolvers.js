const { AuthenticationError } = require("apollo-server-express");
const { User, Book } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (_, { id, username }) => {
            const foundUser = User.fineOne({
                $or: [{ _id: id }, { username: username }],
            });
            if (!foundUser) {
                throw new AuthenticationError(
                    "Cannot find a user with this id!"
                );
            }
            return foundUser;
        },
    },

    Mutation: {
        addUser: async (_, body) => {
            const user = await User.create(body);
            if (!user) {
                throw new AuthenticationError("Something is wrong!");
            }
            const token = signToken(user);
            return { token, user };
        },
        login: async (_, { username, email, password }) => {
            const user = await User.findOne({
                $or: [{ username: username }, { email: email }],
            });
            if (!user) {
                throw new AuthenticationError("Can't find this user");
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError("Wrong password!");
            }
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (_, { user, body }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: body } },
                    { new: true, runValidators: true }
                );

                return updatedUser;
            }
            throw new AuthenticationError("You need to be logged in!");
        },
        removeBook: async (_, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: user._id },
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true }
                );
                if (!updatedUser) {
                    throw new AuthenticationError(
                        "Couldn't find user with this id!"
                    );
                }
                return updatedUser;
            }
        },
    },
};

module.exports = resolvers;
