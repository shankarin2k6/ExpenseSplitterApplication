import React from 'react'

const UnevenAmounts = ({
    names,
    payees,
    unevenAmounts,
    setUnevenAmounts,
    left
}) => {
    const handleAmountEntry = (e, i) => {
        const numEntered = Number(e.target.value)
        if (isNaN(numEntered) && e.target.value !== '.') return
        if (numEntered < 0) return

        setUnevenAmounts(
            unevenAmounts.map((a, idx) => (
                idx === i ? e.target.value : a
            ))
        )
    }

    return ( <
        div className = {
            "uneven-amounts" +
            (left === 0 ?
                "" :
                left > 0 ? " uneven-amounts-positive" : " uneven-amounts-negative")
        } >
        <
        div className = "uneven-amounts-frame custom-scrollbar uneven-scrollbar" > {
            names.map((n, i) => {
                if (payees[i]) return ( <
                    div className = "uneven-amounts-container"
                    key = { i } >
                    <
                    div className = "uneven-amount-name" > { n } < /div> <
                    div className = "uneven-amount-form" >
                    <
                    label htmlFor = { `uneven-${i}` } > ₹ < /label> <
                    input id = { `uneven-${i}` }
                    value = { unevenAmounts[i] }
                    placeholder = "0.00"
                    onChange = { e => handleAmountEntry(e, i) }
                    /> < /
                    div > <
                    /div>
                )
                return null
            })
        } <
        /div> < /
        div >
    )
}

const TabulationBoxes = ({ target, total }) => {
    const left = target - total

    return ( <
        div className = "uneven-tabulation-boxes tabulation-boxes" >
        <
        div className = "tabulation-box" >
        <
        span > TARGET < /span> <
        div > { `₹${target.toFixed(2)}` } <
        /div> < /
        div > <
        div className = "tabulation-box" >
        <
        span > TOTAL < /span> <
        div > { `₹${total.toFixed(2)}` } <
        /div> < /
        div > <
        div className = {
            "tabulation-box left-box" +
            (left === 0 ?
                "" :
                left > 0 ? " left-box-positive" : " left-box-negative")
        } >
        <
        span > LEFT < /span> <
        div > { `₹${left.toFixed(2)}` } <
        /div> < /
        div > <
        /div>
    )
}

const exportObject = { UnevenAmounts, TabulationBoxes }

export default exportObject