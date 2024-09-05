import { GET_USER, GET_BOOKS } from "../queries";
import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

const MyBooks = (props) => {
	const [genre, setGenre] = useState(null);

	const {
		loading: userLoading,
		data: userData,
		refetch: userRefetch,
	} = useQuery(GET_USER);
	const {
		loading: booksLoading,
		data: booksData,
		refetch: booksRefetch,
	} = useQuery(GET_BOOKS, {
		variables: { genre },
	});

	useEffect(() => {
		if (props.show) {
			userRefetch();
			booksRefetch({ genre });
		}
	}, [props.show, userRefetch, booksRefetch, genre]);

	useEffect(() => {
		if (userData && userData.me) {
			setGenre(userData.me.favoriteGenre);
		}
	}, [userData]);

	// useEffect(() => {
	// 	if (genre) {
	// 		booksRefetch({ genre });
	// 	}
	// }, [genre, booksRefetch]);

	if (!props.show) {
		return null;
	}

	if (userLoading || booksLoading) {
		return <div>loading...</div>;
	}

	console.log(booksData);
	
	return (
		<div>
			<h2>Recommendations</h2>

			<p>
				books in your favorite genre <strong>{genre}</strong>
			</p>

			<table>
				<tbody>
					<tr>
						<th></th>
						<th style={{ textAlign: "left" }}>author</th>
						<th style={{ textAlign: "left" }}>published</th>
					</tr>
					{booksData.allBooks.length === 0 ? (
						<tr>
							<td colSpan="3">No recommended books available</td>
						</tr>
					) : (
						booksData.allBooks.map((a) => (
							<tr key={a.id}>
								<td>{a.title}</td>
								<td>{a.author.name}</td>
								<td>{a.published}</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
};

export default MyBooks;
