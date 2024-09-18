import { useState, useEffect } from "react";
import { useApolloClient, useSubscription } from "@apollo/client";

import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import Recommended from "./components/Recommended";
import { BOOK_ADDED, GET_BOOKS } from "./queries";

export const updateCache = (cache, query, addedBook) => {
	const uniqById = (a) => {
		let seen = new Set();
		return a.filter((item) => {
			let k = item.id;
			return seen.has(k) ? false : seen.add(k);
		});
	};

	cache.updateQuery(query, ({ allBooks }) => {
		return {
			allBooks: uniqById(allBooks.concat(addedBook)),
		};
	});
};

const App = () => {
	const [page, setPage] = useState("authors");
	const [token, setToken] = useState(null);

	const client = useApolloClient();

	useEffect(() => {
		const userToken = window.localStorage.getItem("user-token");
		if (userToken) {
			setToken(userToken);
		}
	}, []);

	useSubscription(BOOK_ADDED, {
		onData: ({ data, client }) => {
			const addedBook = data.data.bookAdded;
			window.alert(`New book added: ${addedBook.title}`);

			updateCache(
				client.cache,
				{ query: GET_BOOKS, variables: { genre: null } },
				addedBook
			);
		},
	});

	const logout = () => {
		setPage("authors");
		setToken(null);
		localStorage.clear();
		client.resetStore();
	};

	return (
		<div>
			<div>
				<button onClick={() => setPage("authors")}>authors</button>
				<button onClick={() => setPage("books")}>books</button>
				{token && (
					<>
						<button onClick={() => setPage("add")}>add book</button>
						<button onClick={() => setPage("recommended")}>recommended</button>
					</>
				)}
				{token ? (
					<>
						<button onClick={logout}>logout</button>
					</>
				) : (
					<button onClick={() => setPage("login")}>login</button>
				)}
			</div>

			<Authors show={page === "authors"} token={token} />

			<Books show={page === "books"} />

			<NewBook show={page === "add"} />

			<Recommended show={page === "recommended"} />

			<LoginForm
				show={page === "login"}
				setToken={setToken}
				setPage={setPage}
			/>
		</div>
	);
};

export default App;
