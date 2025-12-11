import React from 'react'
import logo from '../images/coin.svg'

const WebsiteHeader = () => {
  return (
    <div className="website-header">
      <div className="brand">
        <a href="./">
          <h1>
            <img
              src={logo}
              alt="logo"
              className="logo"
            />
            The Expense Splitter
          </h1>
        </a>
      </div>
    </div>
  )
}

export default WebsiteHeader
