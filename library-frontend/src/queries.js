import { gql } from "@apollo/client";

const BOOK_DETAILS = gql`
	fragment BookDetails on Book {
		id
		title
		author {
			name
		}
		published
		genres
	}
`;

export const GET_USER = gql`
	query {
		me {
			id
			username
			favoriteGenre
		}
	}
`;

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
	query AllBooks($genre: [String]) {
		allBooks(genre: $genre) {
			...BookDetails
		}
	}

	${BOOK_DETAILS}
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
			id
			title
			author {
        name
        id
      }
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

export const LOGIN = gql`
	mutation login($username: String!, $password: String!) {
		login(username: $username, password: $password) {
			value
		}
	}
`;

export const BOOK_ADDED = gql`
	subscription {
		bookAdded {
			...BookDetails
		}
	}

	${BOOK_DETAILS}
`;