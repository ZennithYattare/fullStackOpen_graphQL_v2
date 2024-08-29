const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

require("dotenv").config();

mongoose.set("strictQuery", false);

const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");

const MONGODB_URI = process.env.MONGODB_URI;

console.log("connecting to", MONGODB_URI);

mongoose
	.connect(MONGODB_URI)
	.then(() => {
		console.log("connected to MongoDB");
	})
	.catch((error) => {
		console.log("error connection to MongoDB:", error.message);
	});

let authors = [
	{
		name: "Robert Martin",
		id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
		born: 1952,
	},
	{
		name: "Martin Fowler",
		id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
		born: 1963,
	},
	{
		name: "Fyodor Dostoevsky",
		id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
		born: 1821,
	},
	{
		name: "Joshua Kerievsky", // birthyear not known
		id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
	},
	{
		name: "Sandi Metz", // birthyear not known
		id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
	},
];

/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
 *
 * Spanish:
 * Podría tener más sentido asociar un libro con su autor almacenando la id del autor en el contexto del libro en lugar del nombre del autor
 * Sin embargo, por simplicidad, almacenaremos el nombre del autor en conexión con el libro
 */

let books = [
	{
		title: "Clean Code",
		published: 2008,
		author: "Robert Martin",
		id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
		genres: ["refactoring"],
	},
	{
		title: "Agile software development",
		published: 2002,
		author: "Robert Martin",
		id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
		genres: ["agile", "patterns", "design"],
	},
	{
		title: "Refactoring, edition 2",
		published: 2018,
		author: "Martin Fowler",
		id: "afa5de00-344d-11e9-a414-719c6709cf3e",
		genres: ["refactoring"],
	},
	{
		title: "Refactoring to patterns",
		published: 2008,
		author: "Joshua Kerievsky",
		id: "afa5de01-344d-11e9-a414-719c6709cf3e",
		genres: ["refactoring", "patterns"],
	},
	{
		title: "Practical Object-Oriented Design, An Agile Primer Using Ruby",
		published: 2012,
		author: "Sandi Metz",
		id: "afa5de02-344d-11e9-a414-719c6709cf3e",
		genres: ["refactoring", "design"],
	},
	{
		title: "Crime and punishment",
		published: 1866,
		author: "Fyodor Dostoevsky",
		id: "afa5de03-344d-11e9-a414-719c6709cf3e",
		genres: ["classic", "crime"],
	},
	{
		title: "Demons",
		published: 1872,
		author: "Fyodor Dostoevsky",
		id: "afa5de04-344d-11e9-a414-719c6709cf3e",
		genres: ["classic", "revolution"],
	},
];

/*
  you can remove the placeholder query once your first one has been implemented 
*/

const typeDefs = `
	type User {
		username: String!
		favoriteGenre: String!
		id: ID!
	}

	type Token {
		value: String!
	}
		
	type Book {
		id: ID!
		title: String!
		author: Author!
		published: Int!
		genres: [String!]!
	}

	type Author {
		id: ID!
		name: String!
		born: Int
		bookCount: Int!
	}

  type Query {
		bookCount: Int!
		authorCount: Int!
		allBooks(author: String, genre: [String]): [Book!]!
		allAuthors: [Author!]!
		me: User
  }

	type Mutation {
		addBook(
			title: String!
			author: String!
			published: Int!
			genres: [String!]!
		): Book

		editAuthor(
			name: String!
			setBornTo: Int!
		): Author

		createUser(
    username: String!
    favoriteGenre: String!
  	): User

		login(
			username: String!
			password: String!
		): Token
	}
`;

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
};

const server = new ApolloServer({
	typeDefs,
	resolvers,
});

startStandaloneServer(server, {
	listen: { port: 4000 },
	context: async ({ req }) => {
		const token = req ? req.headers.authorization : null;
		if (token && token.toLowerCase().startsWith("bearer ")) {
			const decodedToken = jwt.verify(
				token.substring(7),
				process.env.JWT_SECRET
			);
			const currentUser = await User.findById(decodedToken.id).populate(
				"favoriteGenre"
			);
			return { currentUser };
		}
	},
	formatError: (error) => {
		console.log(error);
		return new GraphQLError("Internal server error");
	},
	onError: (error) => {
		console.log(error);
	},
}).then(({ url }) => {
	console.log(`Server ready at ${url}`);
});
