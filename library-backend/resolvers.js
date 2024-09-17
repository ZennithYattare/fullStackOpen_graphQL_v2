const { GraphQLError } = require("graphql");
const jwt = require("jsonwebtoken");
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");


const resolvers = {
	Query: {
		me: (root, args, context) => {
			return context.currentUser;
		},
		bookCount: async () => Book.countDocuments(),
		authorCount: async () => Author.countDocuments(),
		allBooks: async (root, args) => {
			const { author, genre } = args;

			let query = {};

			if (author) {
				// Find the author by name to get the ObjectId
				const authorDoc = await Author.findOne({ name: author });
				if (!authorDoc) {
					throw new Error(`Author ${author} not found`);
				}
				query.author = authorDoc._id;
			}

			if (genre && genre.length > 0) {
				query.genres = { $in: genre };
			}

			const books = await Book.find(query).populate("author");

			return books;
		},
		allAuthors: async () => Author.find({}),
	},

	Mutation: {
		createUser: async (root, args) => {
			const user = new User({ ...args });
			return user.save().catch((error) => {
				throw new GraphQLError("Creating the user failed", {
					extensions: {
						code: "BAD_USER_INPUT",
						invalidArgs: args.name,
						error,
					},
				});
			});
		},

		login: async (root, args) => {
			const user = await User.findOne({ username: args.username });
			if (!user || args.password !== "hardcodedpassword") {
				throw new GraphQLError("Invalid username or password.", {
					extensions: { code: "BAD_USER_INPUT" },
				});
			}
			const userForToken = {
				username: user.username,
				id: user._id,
			};

			return { value: jwt.sign(userForToken, process.env.JWT_SECRET) };
		},

		addBook: async (root, { author: name, ...args }, context) => {
			const currentUser = context.currentUser;

			if (!currentUser) {
				throw new GraphQLError("User is not authenticated.", {
					extensions: {
						code: "BAD_USER_INPUT",
						invalidArgs: args,
					},
				});
			}

			try {
				let author = await Author.findOne({ name });

				if (!author) {
					author = new Author({ name, bookCount: 0 }); // Initialize bookCount to 0
					try {
						await author.save();
					} catch (saveError) {
						console.log("Error saving author:", saveError.message);
						throw new GraphQLError("Adding author failed", {
							extensions: {
								code: "BAD_USER_INPUT",
								invalidArgs: args,
								error: saveError,
							},
						});
					}
				}

				const book = new Book({ author: author._id, ...args });
				try {
					await book.validate(); // Explicitly validate the book before saving
					await book.save();
				} catch (saveError) {
					console.log("Error saving book:", saveError.message);
					throw new GraphQLError("Adding book failed", {
						extensions: {
							code: "BAD_USER_INPUT",
							invalidArgs: args,
							error: saveError,
						},
					});
				}

				// Increment the bookCount field of the Author model only after the book is successfully saved
				author.bookCount += 1;
				try {
					await author.save();
				} catch (saveError) {
					console.log("Error updating author's bookCount:", saveError.message);
					throw new GraphQLError("Updating author's bookCount failed", {
						extensions: {
							code: "BAD_USER_INPUT",
							invalidArgs: args,
							error: saveError,
						},
					});
				}

				// Populate the author field before returning the book
				const populatedBook = await book.populate("author");

				return populatedBook;
			} catch (error) {
				console.log(error.message);
				throw new GraphQLError("Adding book failed", {
					extensions: {
						code: "BAD_USER_INPUT",
						invalidArgs: args,
						error,
					},
				});
			}
		},

		editAuthor: async (root, args, context) => {
			const currentUser = context.currentUser;

			if (!currentUser) {
				throw new GraphQLError("User is not authenticated.", {
					extensions: {
						code: "BAD_USER_INPUT",
						invalidArgs: args,
					},
				});
			}

			try {
				const author = await Author.findOne({ name: args.name });

				if (!author) {
					return null;
				}

				author.born = args.setBornTo;
				const updatedAuthor = await author.save();

				return updatedAuthor;
			} catch (error) {
				throw new GraphQLError("Editing author failed", {
					extensions: {
						code: "BAD_USER_INPUT",
						invalidArgs: args,
						error,
					},
				});
			}
		},
	},
	// Subscription: {
	// 	personAdded: {
	// 		subscribe: () => pubsub.asyncIterator("PERSON_ADDED"),
	// 	},
	// },
};

module.exports = resolvers;
