import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import axios from 'axios'

function GPACalculator() {
    const [formData, setFormData] = useState({
        studentName: '',
        universityName: '',
        departmentName: '',
        semester: '',
        totalSubjects: 0
    })
    const [subjects, setSubjects] = useState([])
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleInitialSubmit = (e) => {
        e.preventDefault()
        const newSubjects = Array.from({ length: Number(formData.totalSubjects) }, () => ({
            name: '',
            creditHours: '',
            gpa: ''
        }))
        setSubjects(newSubjects)
        setResult(null)
    }

    const handleSubjectChange = (index, field, value) => {
        const newSubjects = [...subjects]
        newSubjects[index][field] = value
        setSubjects(newSubjects)
    }

    const calculateCGPA = async () => {
        let totalCreditHours = 0
        let totalPoints = 0

        const validSubjects = subjects.map(sub => ({
            name: sub.name,
            creditHours: parseFloat(sub.creditHours),
            gpa: parseFloat(sub.gpa)
        }))

        for (let sub of validSubjects) {
            if (!sub.name || isNaN(sub.creditHours) || isNaN(sub.gpa)) {
                alert("Please fill all subject details correctly.")
                return
            }
            totalCreditHours += sub.creditHours
            totalPoints += (sub.creditHours * sub.gpa)
        }

        const sgpa = (totalPoints / totalCreditHours).toFixed(2)
        const resultData = { ...formData, subjects: validSubjects, sgpa }
        setResult(resultData)

        // Save to DB
        try {
            setLoading(true)
            const API_URL = import.meta.env.PROD ? '/results' : 'http://localhost:3000/results'
            await axios.post(API_URL, resultData)
        } catch (error) {
            console.error("Error saving result:", error)
            alert("Calculated but failed to save to database.")
        } finally {
            setLoading(false)
        }
    }

    const generatePDF = () => {
        if (!result) return

        try {
            const doc = new jsPDF()

            // Add Logo
            const logoUrl = '/logo.png'
            const img = new Image()
            img.src = logoUrl
            doc.addImage(img, 'PNG', 10, 10, 30, 30)

            doc.setFontSize(20)
            // Center text with wrapping. Max width approx 150 to allow space for logo and margins if needed, 
            // but since logo is left, we can use full center area.
            // Page width is usually 210. 105 is center.
            doc.text(result.universityName, 105, 25, { align: 'center', maxWidth: 160 })

            doc.setFontSize(16)
            doc.text(`Student Name: ${result.studentName}`, 20, 50)
            doc.text(`Department: ${result.departmentName}`, 20, 60)
            doc.text(`Semester: ${result.semester}`, 20, 70)
            doc.text(`SGPA: ${result.sgpa}`, 20, 80)

            const tableData = result.subjects.map(sub => [sub.name, sub.creditHours, sub.gpa])

            autoTable(doc, {
                startY: 90,
                head: [['Subject Name', 'Credit Hours', 'GPA']],
                body: tableData,
            })

            doc.setFontSize(10)
            doc.text("computer generated result error and omission if any are accepted", 105, doc.internal.pageSize.height - 10, { align: 'center' })


            doc.save('result_card.pdf')
        } catch (error) {
            console.error("Error generating PDF:", error)
            alert("Failed to generate PDF. Check console for details.")
        }
    }

    return (
        <div className="glass-panel">
            <h2>GPA Calculator</h2>

            <form onSubmit={handleInitialSubmit} className="form-group" style={{ alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Student Name</label>
                    <input
                        type="text"
                        value={formData.studentName}
                        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                        required
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>University Name</label>
                    <input
                        type="text"
                        value={formData.universityName}
                        onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                        required
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Department</label>
                    <input
                        type="text"
                        value={formData.departmentName}
                        onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                        required
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Semester</label>
                    <input
                        type="text"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        required
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Total Subjects</label>
                    <input
                        type="number"
                        min="1"
                        value={formData.totalSubjects}
                        onChange={(e) => setFormData({ ...formData, totalSubjects: e.target.value })}
                        required
                    />
                </div>
                <button type="submit">Set Subjects</button>
            </form>

            {subjects.length > 0 && (
                <div className="subjects-container">
                    <h3>Enter Subject Details</h3>
                    {subjects.map((sub, index) => (
                        <div key={index} className="form-group" style={{ marginBottom: '1rem' }}>
                            <input
                                placeholder={`Subject ${index + 1} Name`}
                                value={sub.name}
                                onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Credit Hours"
                                value={sub.creditHours}
                                onChange={(e) => handleSubjectChange(index, 'creditHours', e.target.value)}
                            />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="GPA"
                                value={sub.gpa}
                                onChange={(e) => handleSubjectChange(index, 'gpa', e.target.value)}
                            />
                        </div>
                    ))}
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button onClick={calculateCGPA} disabled={loading}>
                            {loading ? 'Calculating & Saving...' : 'Calculate Result'}
                        </button>
                    </div>
                </div>
            )}

            {result && (
                <div className="result-display" style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '2rem', color: 'var(--secondary-color)' }}>Calculated SGPA: {result.sgpa}</h3>
                    <button onClick={generatePDF} style={{ marginTop: '1rem' }}>Download Result Card (PDF)</button>
                </div>
            )}
        </div>
    )
}

export default GPACalculator
