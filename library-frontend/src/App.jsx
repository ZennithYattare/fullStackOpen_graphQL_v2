import { useState, useEffect } from "react";
import { useApolloClient } from "@apollo/client";

import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import Recommended from "./components/Recommended";

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
