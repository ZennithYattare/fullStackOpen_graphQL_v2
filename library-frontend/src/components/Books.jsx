import { GET_BOOKS } from "../queries"
import { useQuery } from "@apollo/client"
import { useState, useEffect } from "react"

const Books = (props) => {
  if (!props.show) {
    return null
  }

  const books = useQuery(GET_BOOKS);

  if (books.loading) {
    return <div>loading...</div>;
  }

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.data.allBooks.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Books
