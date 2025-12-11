import React from 'react'

const NameBox = ({ name, defaultName, i, names, setNames, inputClass }) => {
  if (name === null)
    return <input className="empty-namebox" disabled />

  const handleNameEntry = e => {
    const newNames = [...names]
    if (e.target.value === '') newNames[i] = `🙂${i + 1}`
    else newNames[i] = e.target.value
    setNames(newNames)
  }

  return (
    <>
      <input
        value={name === defaultName ? "" : name}
        placeholder={`Person ${i + 1}`}
        onChange={handleNameEntry}
        className={inputClass}
      />
      {inputClass === "names-gte6" ? null : <br/>}
    </>
  )
}

const NameBoxes = ({ numOfPeople, names, setNames }) => {
  const namesToShow = names.slice(0, numOfPeople)

  if (numOfPeople >= 6) {
    // Group names in sets of three
    const groupedNames = []
    namesToShow.forEach((n, i) => {
      if (i % 3 === 0) groupedNames.push([])
      groupedNames[groupedNames.length - 1].push(n)
    })
    for (let i = groupedNames[groupedNames.length - 1].length;
        i < 3; i++) {
      groupedNames[groupedNames.length - 1].push(null)
    }

    return (
      <>
        {groupedNames.map((group, i) => (
          <div className="name-group" key={i}>
            {group.map((name, j) => (
              <NameBox
                name={name}
                defaultName={`🙂${i*3 + j + 1}`}
                i={i*3 + j}
                names={names}
                setNames={setNames}
                inputClass="names-gte6"
                key={j}
              />
            ))}
          </div>
        ))}
      </>
    )
  }

  return (
    <>
      {namesToShow.map((name, i) => (
        <NameBox
          name={name}
          defaultName={`🙂${i + 1}`}
          i={i}
          names={names}
          setNames={setNames}
          inputClass="names-lt6"
          key={i}
        />
      ))}
    </>
  )
}

/**
 * Section 2
 */
const NameSection = ({ show, numOfPeople, names, setNames,
                       setShowSection }) => {
  const handleNext = e => {
    e.preventDefault()
    setShowSection([false, false, true])
  }

  if (!show) return null

  return (
    <div className="name-section">
      <h3>What are your names?</h3>
      <p>This is optional. (Hit ➞ to skip.)</p>
      <form>
        <NameBoxes
          numOfPeople={numOfPeople}
          names={names}
          setNames={setNames}
        />
        <button className="next-button" onClick={handleNext} type="submit" autoFocus>
          ➞
        </button>
      </form>
    </div>
  )
}

export default NameSection
