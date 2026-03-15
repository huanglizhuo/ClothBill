import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TripDashboardPage from './pages/TripDashboardPage'
import AddExpensePage from './pages/AddExpensePage'
import ExpenseListPage from './pages/ExpenseListPage'
import SettlementPage from './pages/SettlementPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <div className="min-h-full max-w-lg mx-auto bg-white shadow-sm">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/trip/:tripId" element={<TripDashboardPage />} />
        <Route path="/trip/:tripId/expense" element={<AddExpensePage />} />
        <Route path="/trip/:tripId/expense/:expenseId" element={<AddExpensePage />} />
        <Route path="/trip/:tripId/expenses" element={<ExpenseListPage />} />
        <Route path="/trip/:tripId/settle" element={<SettlementPage />} />
        <Route path="/trip/:tripId/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  )
}
