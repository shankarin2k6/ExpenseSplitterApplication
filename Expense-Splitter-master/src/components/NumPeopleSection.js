import React, { useState } from 'react'

const ErrorMessage = ({ message, nameOfClass }) => {
  if (message === '') return null
  return <p className={nameOfClass}>{message}</p>
}

const NumPeopleInputBox = ({ numOfPeople, setNumOfPeople }) => {
  const handleNumOfPeopleEntry = e => {
    const numEntered = Number(e.target.value)
    if (isNaN(numEntered)) return
    if (numEntered % 1 !== 0) return  // float check
    setNumOfPeople(numEntered)
  }

  return (
    <input
      value={numOfPeople === 0 ? "" : numOfPeople}
      placeholder="2"
      onChange={handleNumOfPeopleEntry}
    />
  )
}

/**
 * Section 1
 */
const NumPeopleSection = ({ show, numOfPeople, setNumOfPeople,
                            setShowSection }) => {
  const [errorMessage, setErrorMessage] = useState('')

  const handleNext = e => {
    e.preventDefault()

    // If the user didn't key in anything, use the default value of 2
    if (numOfPeople === 0) {
      setNumOfPeople(2)
      setShowSection([false, true, false])
    }
    // If the user did key in a number, check that it is valid
    else if (numOfPeople >= 2 && numOfPeople <= 20) {
      setShowSection([false, true, false])
    }
    // If invalid, display an error message
    else {
      setErrorMessage(
        `Please enter a number from 2-20.`
      )
      setTimeout(() => setErrorMessage(''), 4000)
    }
  }

  if (!show) return null

  return (
    <div className="num-people-section">
      <h3>How many people?</h3>
      <p>Enter a number from 2 to 20.</p>
      <form className="num-people-form">
        <NumPeopleInputBox
          numOfPeople={numOfPeople}
          setNumOfPeople={setNumOfPeople}
        />
        <br/>
        <ErrorMessage
          message={errorMessage}
          nameOfClass="num-people-error"
        />
        <button
          className="next-button"
          onClick={handleNext}
          type="submit"
          autoFocus
        >
          ➞
        </button>
      </form>
    </div>
  )
}

const exportObject = { NumPeopleSection, ErrorMessage }

export default exportObject
