const { AuthenticationError } = require("apollo-server-express");
const { User, Book } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        getSingleUser: async (_, { id, username }) => {
            return User.fineOne({
                $or: [{ _id: id }, { username: username }],
            });
        },
    },

    Mutation: {
        createUser: async (_, body) => {
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
                throw new AuthenticationError(
                    "No user found with this email address"
                );
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError("Incorrect credentials");
            }
            const token = signToken(user);
            return { token, user };
        },
        savedBook: async (_, { body }, context) => {
            if (context.user) {
                await User.findOneAndUpdate(
                    { _id: user._id },
                    { $addToSet: { savedBooks: body } },
                    { new: true, runValidators: true }
                );

                return body;
            }
            throw new AuthenticationError("You need to be logged in!");
        },
        deleteBook: async (_, { bookId }, context) => {
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
