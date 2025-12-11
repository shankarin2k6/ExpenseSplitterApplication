import React, { useState } from 'react'
import ExpenseForm from './ExpenseForm'
import ExpenseList from './ExpenseList'
import TransferSection from './ExpenseTransfers'

const AmountToPaySection = ({ names, expenses }) => {
    // Initialize adjacency matrix-type representation
    const amountOwedBy = {}
    for (let n1 of names) {
        amountOwedBy[n1] = {}
        for (let n2 of names)
            amountOwedBy[n1][n2] = 0
    }

    // Fill up "adjacency matrix"
    for (let e of expenses) {
        for (let p of e.payeeNames) {
            if (p !== e.payer)
                amountOwedBy[p][e.payer] += e.payeeAmounts[p]
        }
    }

    // Optimize the matrix using the following algorithm:
    // Find all consecutive edges and reduce them. For example, if A owes B $1
    // and B owes C $1, then we reduce it such that A owes C $1.
    for (let p1 in amountOwedBy) {
        let noConsecutiveEdges = false // a consecutive edge is an edge from A to B
            // combined with an edge from B to C
        while (!noConsecutiveEdges) {
            let noConsecutiveEdgeCheck = true
            for (let p2 in amountOwedBy[p1]) {
                if (amountOwedBy[p1][p2] > 0) {
                    for (let p3 in amountOwedBy[p2]) {
                        if (amountOwedBy[p2][p3] > 0) {
                            noConsecutiveEdgeCheck = false
                            if (amountOwedBy[p1][p2] >= amountOwedBy[p2][p3]) {
                                amountOwedBy[p1][p3] += amountOwedBy[p2][p3]
                                amountOwedBy[p1][p2] -= amountOwedBy[p2][p3]
                                amountOwedBy[p2][p3] = 0
                            } else {
                                amountOwedBy[p1][p3] += amountOwedBy[p1][p2]
                                amountOwedBy[p2][p3] -= amountOwedBy[p1][p2]
                                amountOwedBy[p1][p2] = 0
                            }
                            break
                        }
                    }
                }
            }
            noConsecutiveEdges = noConsecutiveEdgeCheck
        }
    }

    // Record amounts that need to be paid
    const payments = []
    for (let p1 in amountOwedBy) {
        for (let p2 in amountOwedBy[p1]) {
            if (amountOwedBy[p1][p2] > 0) {
                payments.push({
                    debtor: p1,
                    debtee: p2,
                    amount: amountOwedBy[p1][p2],
                })
            }
        }
    }

    return ( <
        >
        <
        p > < strong > How much to pay < /strong></p >
        <
        div > { payments.length === 0 ? < div className = "filler" / > : null } {
            payments.map((p, i) => ( <
                p className = "payment-item"
                key = { i } > { p.debtor }🠖 { p.debtee }: $ { p.amount.toFixed(2) } <
                /p>
            ))
        } <
        /div> < / >
    )
}

const ExpenseSection = ({ show, names }) => {
    const [expenses, setExpenses] = useState([])

    if (!show) return null

    return ( <
        div className = "expense-section" >
        <
        h3 className = "expense-form-title" > Enter your expense < /h3> <
        ExpenseForm names = { names }
        expenses = { expenses }
        setExpenses = { setExpenses }
        /> <
        h3 className = "expenses-entered-title" > Expenses you 've entered</h3> <
        ExpenseList expenses = { expenses }
        setExpenses = { setExpenses }
        /> <
        h3 className = "transfers-title" > Transfers to make < /h3> <
        TransferSection names = { names }
        expenses = { expenses }
        /> < /
        div >
    )
}

export default ExpenseSection