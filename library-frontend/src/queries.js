import { gql } from "@apollo/client";


export const GET_AUTHORS = gql`
	query {
		allAuthors {
			id
			name
			born
			bookCount
		}
	}
`;

export const GET_BOOKS = gql`
	query {
		allBooks {
			id
			author
			genres
			published
			title
		}
	}
`;