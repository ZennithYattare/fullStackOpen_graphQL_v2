const { ApolloServer } = require("@apollo/server");
const {
	ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const { expressMiddleware } = require("@apollo/server/express4");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { GraphQLError } = require("graphql");

const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/lib/use/ws')

const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
mongoose.set("strictQuery", false);

// const Book = require("./models/book");
// const Author = require("./models/author");
const User = require("./models/user");

const typeDefs = require('./schema')
const resolvers = require('./resolvers')

require("dotenv").config();

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

const start = async () => {
	const app = express();
	const httpServer = http.createServer(app);

	const wsServer = new WebSocketServer({
		server: httpServer,
		path: "/",
	});

	const schema = makeExecutableSchema({ typeDefs, resolvers });
	const serverCleanup = useServer({ schema }, wsServer);

	const server = new ApolloServer({
		schema,
		plugins: [
			ApolloServerPluginDrainHttpServer({ httpServer }),
			{
				async serverWillStart() {
					return {
						async drainServer() {
							await serverCleanup.dispose();
						},
					};
				},
			},
		],
	});

	await server.start();

	app.use(
		"/",
		cors(),
		express.json(),
		expressMiddleware(server, {
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
		})
	);

	const PORT = 4000;

	httpServer.listen(PORT, () =>
		console.log(`Server is now running on http://localhost:${PORT}`)
	);
};

start();
