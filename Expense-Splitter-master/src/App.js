import React, { useState } from 'react'
import './App.css'
import WebsiteHeader from './components/Header'
import NumPeopleSection from './components/NumPeopleSection'
import NameSection from './components/NameSection'
import ExpenseSection from './components/ExpenseSection'
import 'bootstrap/dist/css/bootstrap.min.css'

const App = () => {
  // Section toggler
  const [showSection, setShowSection] = useState([true, false, false])

  // For section 1
  const [numOfPeople, setNumOfPeople] = useState(0)

  // For section 2
  const [names, setNames] = useState([
    '🙂1', '🙂2', '🙂3', '🙂4', '🙂5',
    '🙂6', '🙂7', '🙂8', '🙂9', '🙂10',
    '🙂11', '🙂12', '🙂13', '🙂14', '🙂15',
    '🙂16', '🙂17', '🙂18', '🙂19', '🙂20',
  ])

  return (
    <div>
      <WebsiteHeader />
      <div className="text-center container main">
        <h1 className="header">Quicksplit</h1>
        <NumPeopleSection.NumPeopleSection
          show={showSection[0]}
          numOfPeople={numOfPeople}
          setNumOfPeople={setNumOfPeople}
          setShowSection={setShowSection}
        />
        <NameSection
          show={showSection[1]}
          numOfPeople={numOfPeople}
          names={names}
          setNames={setNames}
          setShowSection={setShowSection}
        />
        <ExpenseSection
          show={showSection[2]}
          names={names.slice(0, numOfPeople)}
        />
      </div>
    </div>
  )
}

export default App
