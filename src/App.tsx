import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TripDashboardPage from './pages/TripDashboardPage'
import AddExpensePage from './pages/AddExpensePage'
import ExpenseDetailPage from './pages/ExpenseDetailPage'
import ExpenseListPage from './pages/ExpenseListPage'
import SettlementPage from './pages/SettlementPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <div className="relative min-h-full mx-auto bg-white md:max-w-2xl lg:max-w-4xl md:shadow-sm">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/bill/:tripId" element={<TripDashboardPage />} />
        <Route path="/bill/:tripId/expense" element={<AddExpensePage />} />
        <Route path="/bill/:tripId/expense/:expenseId" element={<ExpenseDetailPage />} />
        <Route path="/bill/:tripId/expense/:expenseId/edit" element={<AddExpensePage />} />
        <Route path="/bill/:tripId/expenses" element={<ExpenseListPage />} />
        <Route path="/bill/:tripId/settle" element={<SettlementPage />} />
        <Route path="/bill/:tripId/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  )
}
