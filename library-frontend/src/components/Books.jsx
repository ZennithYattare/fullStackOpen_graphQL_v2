import { GET_BOOKS } from "../queries";
import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

const Books = (props) => {
	const [genre, setGenre] = useState(null);
	const books = useQuery(GET_BOOKS, {
		variables: { genre },
	});

	if (!props.show) {
		return null;
	}

	if (books.loading) {
		return <div>loading...</div>;
	}

	const genres = [...new Set(books.data.allBooks.flatMap((b) => b.genres))];

	return (
		<div>
			<h2>books</h2>

			{genre ? (
				<p>
					in genre <b>{genre}</b>
				</p>
			) : (
				<p>all genres</p>
			)}

			<div>
				{genres.map((g) => (
					<button key={g} onClick={() => setGenre(g)}>
						{g}
					</button>
				))}
				{genre && <button onClick={() => setGenre(null)}>all genres</button>}
			</div>

			<table>
				<tbody>
					<tr>
						<th></th>
						<th>author</th>
						<th>published</th>
					</tr>
					{books.data.allBooks.map((a) => (
						<tr key={a.id}>
							<td>{a.title}</td>
							<td>{a.author.name}</td>
							<td>{a.published}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Books;
