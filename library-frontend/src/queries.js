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
			author {
				name
			}
			genres
			published
			title
		}
	}
`;

export const ADD_BOOK = gql`
	mutation addBook(
		$title: String!
		$author: String!
		$published: Int!
		$genres: [String!]!
	) {
		addBook(
			title: $title
			author: $author
			published: $published
			genres: $genres
		) {
			title
			author
			published
			genres
		}
	}
`;

export const UPDATE_AUTHOR_BORN = gql`
	mutation updateAuthorBorn($name: String!, $born: Int!) {
		editAuthor(name: $name, setBornTo: $born) {
			name
			born
		}
	}
`;