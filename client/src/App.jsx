import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import GPACalculator from './components/GPACalculator'

function App() {
  const [users, setUsers] = useState([])
  const [view, setView] = useState('users') // 'users' or 'gpa'
  const [formData, setFormData] = useState({ name: '', email: '', age: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  const API_URL = import.meta.env.PROD ? '/users' : 'http://localhost:3000/users'

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await axios.get(API_URL)
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, formData)
        setEditingId(null)
      } else {
        await axios.post(API_URL, formData)
      }
      setFormData({ name: '', email: '', age: '' })
      fetchUsers()
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  const handleEdit = (user) => {
    setEditingId(user._id)
    setFormData({ name: user.name, email: user.email, age: user.age })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API_URL}/${id}`)
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Student Portal</h1>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button 
                className={view === 'users' ? '' : 'secondary'} 
                onClick={() => setView('users')}
            >
                User Management
            </button>
            <button 
                className={view === 'gpa' ? '' : 'secondary'} 
                onClick={() => setView('gpa')}
            >
                GPA Calculator
            </button>
        </div>
      </header>

      {view === 'gpa' ? (
        <GPACalculator />
      ) : (
        <>
      {/* Form Section */}
      <div className="glass-panel">
        <form onSubmit={handleSubmit} className="form-group">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleInputChange}
            required
          />
          <button type="submit">
            {editingId ? 'Update User' : 'Add User'}
          </button>

          {editingId && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', email: '', age: '' });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* List Section */}
      <div className="glass-panel">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No users found. Add one above!</p>
          </div>
        ) : (
          <table className="user-list">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Age</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.age}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(user._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
        </>
      )}
    </div>
  )
}

export default App
