import React from 'react'
import deleteButton from '../images/delete.svg'

const ExpenseListItem = ({ expense, deleteExpense }) => {
    const formatExpenseStr = () => {
        const formatPayeeNames = () => {
            return expense.payeeNames.join(', ')
        }

        return (
            `${expense.payer} paid ₹${expense.amount.toFixed(2)}` +
            `: ${formatPayeeNames()}`
        )
    }

    return ( <
        div className = "expense-list-item-container" >
        <
        p > { formatExpenseStr() } <
        /p> <
        img src = { deleteButton }
        className = "expense-delete-button"
        alt = "delete"
        onClick = {
            () => deleteExpense(expense) }
        /> <
        /div>
    )
}

const ExpenseList = ({ expenses, setExpenses }) => {
    if (expenses.length === 0) {
        return ( <
            div className = "expense-list" >
            <
            div >
            <
            div className = "expense-list-placeholder" >
            <
            p > Nothing to show! < /p> <
            /div> <
            /div> <
            /div>
        )
    }

    const deleteExpense = expenseToDelete => {
        setExpenses(expenses.filter(e => e !== expenseToDelete))
    }

    return ( <
        div className = "expense-list" >
        <
        div > {
            expenses.map((e, i) => ( <
                ExpenseListItem expense = { e }
                deleteExpense = { deleteExpense }
                key = { i }
                />
            ))
        } <
        /div> <
        /div>
    )
}

export default ExpenseList