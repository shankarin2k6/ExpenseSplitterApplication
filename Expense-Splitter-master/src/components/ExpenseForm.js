import React, { useState } from 'react'
import NumPeopleSection from './NumPeopleSection'
import UnevenComponents from './UnevenComponents'
import MealComponents from './MealComponents'

// Helper function for 2 dp upward rounding
const roundUpTo2DecimalPlaces = number => Math.ceil(number * 100) / 100

const AmountBox = ({ amount, setAmount, errorMessage }) => {
    const handleAmountEntry = e => {
        const numEntered = Number(e.target.value)
        if (isNaN(numEntered) && e.target.value !== '.') return
        if (numEntered < 0) return
        setAmount(e.target.value)
    }

    return ( <
        div className = {
            (errorMessage === "Please enter a valid amount." ?
                "amount-box-error " :
                "") +
            "amount-box"
        } >
        <
        label htmlFor = "amount" > ₹ < /label> <
        input value = { amount }
        id = "amount"
        onChange = { handleAmountEntry }
        /> <
        /div>
    )
}

const ModeSelector = ({ mode, setMode }) => {
    const changeMode = (e, newMode) => {
        e.preventDefault()
        if (newMode !== mode) setMode(newMode)
    }

    return ( <
        div className = "mode-selector" >
        <
        div >
        <
        button className = { mode === "even" ? "activated-mode" : "deactivated-mode" }
        onClick = { e => changeMode(e, "even") } >
        Even <
        /button> <
        button className = { mode === "uneven" ? "activated-mode" : "deactivated-mode" }
        onClick = { e => changeMode(e, "uneven") } >
        Uneven <
        /button> <
        button className = { mode === "meals" ? "activated-mode" : "deactivated-mode" }
        onClick = { e => changeMode(e, "meals") } >
        Meals <
        /button> <
        /div> <
        /div>
    )
}

const PayerSelection = ({ names, payerIdx, setPayerIdx, mode }) => {
    const handlePayerSelection = (e, idx) => {
        e.preventDefault()
        setPayerIdx(idx)
    }

    return ( <
        div className = "payer-selection" >
        <
        div className = "section-title" >
        <
        div > Who paid ? < /div> <
        /div> <
        div className = {
            "payer-frame custom-scrollbar" +
            (mode !== "uneven" ?
                "" :
                " payer-frame-uneven")
        } >
        {
            names.map((n, i) => ( <
                button className = "payer-item"
                disabled = { i === payerIdx }
                onClick = { e => handlePayerSelection(e, i) }
                key = { i } >
                <
                p > { n } < /p> <
                /button>
            ))
        } <
        /div> <
        /div>
    )
}

const PayeeSelection = ({ names, payees, setPayees, errorMessage, mode }) => {
    const changePayeeStatus = (e, i) => {
        e.preventDefault()
        setPayees(payees.map((p, idx) => idx === i ? !p : p))
    }

    return ( <
        div className = {
            (errorMessage === "Please select at least one payee." ?
                "payee-selection-error " :
                "") +
            "payee-selection"
        } >
        <
        div className = "section-title" >
        <
        div > Who 's involved?</div> <
        /div> <
        div className = {
            "payee-frame custom-scrollbar" +
            (mode === "even" ?
                "" :
                " payee-frame-uneven")
        } >
        {
            names.map((n, i) => ( <
                div className = { "payee-item-container" }
                key = { i } >
                <
                button className = { payees[i] ? "payee-item-enabled" : "payee-item-disabled" }
                onClick = { e => changePayeeStatus(e, i) } >
                <
                p > { n } < /p> <
                /button> <
                /div>
            ))
        } <
        /div> <
        /div>
    )
}

const UnevenContainer = ({
    mode,
    amount,
    names,
    payees,
    unevenAmounts,
    setUnevenAmounts
}) => {
    if (mode === "even") return null

    let target = isNaN(Number(amount)) ? 0 : Number(amount)
    let total = unevenAmounts.reduce((total, amt, i) => {
        if (payees[i]) {
            if (isNaN(Number(amt))) return total
            return total + Number(amt)
        }
        return total
    }, 0)
    target = roundUpTo2DecimalPlaces(target)
    total = roundUpTo2DecimalPlaces(total)

    return ( <
        div className = "uneven-container" >
        <
        UnevenComponents.UnevenAmounts names = { names }
        payees = { payees }
        unevenAmounts = { unevenAmounts }
        setUnevenAmounts = { setUnevenAmounts }
        left = { target - total }
        /> <
        UnevenComponents.TabulationBoxes target = { target }
        total = { total }
        /> <
        /div>
    )
}

const MealsLayout = ({
    amount,
    names,
    payees,
    setPayees,
    dishNumber,
    setDishNumber,
    dishAmount,
    setDishAmount,
    mealAmounts,
    setMealAmounts,
    payerIdx,
    setPayerIdx
}) => {
    let target = isNaN(Number(amount)) ? 0 : Number(amount)
    let total = mealAmounts.reduce((total, amt) => (total + amt), 0)
    target = roundUpTo2DecimalPlaces(target)
    total = roundUpTo2DecimalPlaces(total)

    return ( <
        div className = "meals-layout" >
        <
        MealComponents.DishSection names = { names }
        dishNumber = { dishNumber }
        setDishNumber = { setDishNumber }
        dishAmount = { dishAmount }
        setDishAmount = { setDishAmount }
        payees = { payees }
        setPayees = { setPayees }
        mealAmounts = { mealAmounts }
        setMealAmounts = { setMealAmounts }
        /> <
        div className = "meals-container" >
        <
        MealComponents.MealAmounts names = { names }
        mealAmounts = { mealAmounts }
        setMealAmounts = { setMealAmounts }
        left = { target - total }
        setDishNumber = { setDishNumber }
        setDishAmount = { setDishAmount }
        /> <
        MealComponents.TabulationBoxes target = { target }
        total = { total }
        mealAmounts = { mealAmounts }
        setMealAmounts = { setMealAmounts }
        /> <
        /div> <
        hr / >
        <
        MealComponents.PayerSelection names = { names }
        payerIdx = { payerIdx }
        setPayerIdx = { setPayerIdx }
        /> <
        /div>
    )
}

const FormLayout = ({
    names,
    amount,
    mode,
    payerIdx,
    setPayerIdx,
    payees,
    setPayees,
    unevenAmounts,
    setUnevenAmounts,
    dishNumber,
    setDishNumber,
    dishAmount,
    setDishAmount,
    mealAmounts,
    setMealAmounts,
    errorMessage
}) => {
    if (mode === "meals") {
        return ( <
            MealsLayout amount = { amount }
            names = { names }
            payees = { payees }
            setPayees = { setPayees }
            dishNumber = { dishNumber }
            setDishNumber = { setDishNumber }
            dishAmount = { dishAmount }
            setDishAmount = { setDishAmount }
            mealAmounts = { mealAmounts }
            setMealAmounts = { setMealAmounts }
            payerIdx = { payerIdx }
            setPayerIdx = { setPayerIdx }
            />
        )
    }

    return ( <
        >
        <
        div className = "payer-payee-section" >
        <
        PayerSelection names = { names }
        payerIdx = { payerIdx }
        setPayerIdx = { setPayerIdx }
        mode = { mode }
        /> <
        PayeeSelection names = { names }
        payees = { payees }
        setPayees = { setPayees }
        errorMessage = { errorMessage }
        mode = { mode }
        /> <
        /div> <
        UnevenContainer mode = { mode }
        amount = { amount }
        names = { names }
        payees = { payees }
        unevenAmounts = { unevenAmounts }
        setUnevenAmounts = { setUnevenAmounts }
        /> <
        />
    )
}

const SubmitButton = ({ submitExpenseHandler, succeedFlag }) => {
    const submitExpense = e => {
        e.preventDefault()
        submitExpenseHandler()
    }

    return ( <
        div className = "submit-button" >
        <
        button type = "submit"
        className = { succeedFlag ? "submit-succeed" : "" }
        onClick = { submitExpense } >
        ✓
        <
        /button> <
        /div>
    )
}

const ExpenseForm = ({ names, expenses, setExpenses }) => {
    /* States */
    const [amount, setAmount] = useState('')
    const [mode, setMode] = useState("even")
    const [payerIdx, setPayerIdx] = useState(0)
    const [payees, setPayees] = useState([])
    const [unevenAmounts, setUnevenAmounts] = useState([])
    const [errorMessage, setErrorMessage] = useState('')
    const [submitSucceeded, setSubmitSucceeded] = useState(false)

    // Meal mode states
    const [dishNumber, setDishNumber] = useState(1)
    const [dishAmount, setDishAmount] = useState('')
    const [mealAmounts, setMealAmounts] = useState([])

    // To update certain states after the initial render
    if (payees.length !== names.length) {
        setPayees(names.map(n => true))
        setUnevenAmounts(names.map(n => ''))
        setMealAmounts(names.map(n => 0))
    }

    /* Creating an expense item */
    // Helper function for setting error messages
    const errorMessageWithTimer = (message, duration) => {
        setErrorMessage(message)
        setTimeout(() => setErrorMessage(''), duration)
    }

    // Helper function for even splitting
    const splitEvenly = roundedAmount => {
        const numOfPayees = payees.reduce((s, p) => s + p, 0)
        const amountPerPerson = roundedAmount / numOfPayees
        const indivAmounts = {}
        names.forEach((n, i) => {
            if (payees[i]) indivAmounts[n] = amountPerPerson
            else indivAmounts[n] = 0
        })
        return indivAmounts
    }

    // Checks that the sum of individual amounts equals to the stated total
    const validateUnevenSplit = () => {
        const target = Number(amount)
        const total = unevenAmounts.reduce((total, amt, i) => {
            if (payees[i]) {
                if (isNaN(Number(amt))) return total
                return total + Number(amt)
            }
            return total
        }, 0)
        return (roundUpTo2DecimalPlaces(target) === roundUpTo2DecimalPlaces(total))
    }

    const validateMealSplit = () => {
        let target = isNaN(Number(amount)) ? 0 : Number(amount)
        let total = mealAmounts.reduce((total, amt) => (total + amt), 0)
        return (roundUpTo2DecimalPlaces(target) === roundUpTo2DecimalPlaces(total))
    }

    // Helper function for uneven splitting
    const splitUnevenly = () => {
        const indivAmounts = {}
        names.forEach((n, i) => {
            if (payees[i] && !isNaN(Number(unevenAmounts[i]))) {
                indivAmounts[n] = Number(unevenAmounts[i])
            } else indivAmounts[n] = 0
        })
        return indivAmounts
    }

    // Helper function for meal splitting
    const splitMeals = () => {
        const indivAmounts = {}
        names.forEach((n, i) => { indivAmounts[n] = mealAmounts[i] })
        return indivAmounts
    }

    // Submit expense
    const submitExpenseHandler = () => {
        // Amount validation
        const amountAsNumber = Number(amount)
        if (amountAsNumber <= 0 || isNaN(amountAsNumber)) {
            errorMessageWithTimer("Please enter a valid amount.", 5000)
            return
        }

        // Payee validation
        if (payees.find(p => p) === undefined) {
            errorMessageWithTimer("Please select at least one payee.", 5000)
            return
        }

        // Uneven amount validation
        if (mode === "uneven" && !validateUnevenSplit()) {
            errorMessageWithTimer(
                "Please ensure the \"LEFT\" box reads 0.",
                5000
            )
            return
        }

        // Meal amount validation
        if (mode === "meals" && !validateMealSplit()) {
            errorMessageWithTimer(
                "Please ensure the \"LEFT\" box reads 0. Use \"Split Tax/Tip\" to do this for you!",
                7000
            )
            return
        }

        // Create new expense object
        const newExpense = {
            isEven: mode === "even",
            amount: roundUpTo2DecimalPlaces(amountAsNumber),
            payer: names[payerIdx],
            payeeNames: null,
            payeeAmounts: null,
        }

        // Set "payeeNames" and "payeeAmounts" fields
        if (mode === "even") {
            newExpense.payeeNames = names.filter((n, i) => payees[i])
            newExpense.payeeAmounts = splitEvenly(newExpense.amount)
        } else if (mode === "uneven") {
            newExpense.payeeNames = names.filter((n, i) => (
                payees[i] && Number(unevenAmounts[i]) !== 0 && !isNaN(Number(unevenAmounts[i]))
            ))
            newExpense.payeeAmounts = splitUnevenly()
        } else {
            newExpense.payeeNames = names.filter((n, i) => mealAmounts[i] !== 0)
            newExpense.payeeAmounts = splitMeals()
        }

        // Add new expense to expenses list
        setExpenses(expenses.concat(newExpense))

        // Reset expense form (certain fields)
        setAmount('')
        setUnevenAmounts(names.map(n => ''))
        setDishNumber(1)
        setDishAmount('')
        setMealAmounts(names.map(n => 0))
        setErrorMessage('')

        // Indicate that the submit was successful
        setSubmitSucceeded(true)
        setTimeout(() => setSubmitSucceeded(false), 2500)
    }

    /* Render */
    return ( <
        div >
        <
        div className = "expense-form" >
        <
        div >
        <
        AmountBox amount = { amount }
        setAmount = { setAmount }
        errorMessage = { errorMessage }
        /> <
        ModeSelector mode = { mode }
        setMode = { setMode }
        /> <
        FormLayout names = { names }
        amount = { amount }
        mode = { mode }
        payerIdx = { payerIdx }
        setPayerIdx = { setPayerIdx }
        payees = { payees }
        setPayees = { setPayees }
        unevenAmounts = { unevenAmounts }
        setUnevenAmounts = { setUnevenAmounts }
        dishNumber = { dishNumber }
        setDishNumber = { setDishNumber }
        dishAmount = { dishAmount }
        setDishAmount = { setDishAmount }
        mealAmounts = { mealAmounts }
        setMealAmounts = { setMealAmounts }
        errorMessage = { errorMessage }
        /> <
        div className = { submitSucceeded ? "look-below" : "hide-look-below" } > ↓
        <
        /div> <
        /div> <
        /div> <
        div className = "submission-container" >
        <
        div >
        <
        NumPeopleSection.ErrorMessage message = { errorMessage }
        nameOfClass = "expense-form-error" /
        >
        <
        SubmitButton submitExpenseHandler = { submitExpenseHandler }
        succeedFlag = { submitSucceeded }
        /> <
        /div> <
        /div> <
        /div>
    )
}

export default ExpenseForm