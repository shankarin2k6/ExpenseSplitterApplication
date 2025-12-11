import React from 'react'

const TransferSection = ({ names, expenses }) => {
    // Compute amounts to transfer
    const amountOwedBy = {}
    names.forEach(n1 => {
        amountOwedBy[n1] = {}
        names.forEach(n2 => amountOwedBy[n1][n2] = 0)
    })
    expenses.forEach(e => {
        e.payeeNames.forEach(p => {
            amountOwedBy[p][e.payer] += e.payeeAmounts[p]
            amountOwedBy[e.payer][p] -= e.payeeAmounts[p]
        })
    })

    // Convert object to array of amounts owed
    const amountsToShow = []
    for (let payee in amountOwedBy) {
        for (let payer in amountOwedBy[payee]) {
            if (payer !== payee && amountOwedBy[payee][payer] > 0) {
                amountsToShow.push({ payer: payer, payee: payee, amount: amountOwedBy[payee][payer] })
            }
        }
    }

    return ( <
        div className = "transfer-section" >
        <
        div >
        <
        div className = "transfer-section-container" > {
            amountsToShow.map((a, i) => ( <
                div className = "transfer-item-container"
                key = { i } >
                <
                div className = "transfer-item-payee" > { a.payee } < /div> <
                div className = "transfer-item-arrow" >
                <
                span > { `₹${a.amount.toFixed(2)}` } < /span> <
                /div> <
                div className = "transfer-item-payer" > { a.payer } < /div> <
                /div>
            ))
        } <
        /div> <
        /div> <
        /div>
    )
}

export default TransferSection