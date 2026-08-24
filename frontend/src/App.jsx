import { useState, useMemo } from 'react'
import axios from 'axios'

function App() {
  const [students, setStudents] = useState([])
  const [debarredIds, setDebarredIds] = useState(new Set())
  const [minScore, setMinScore] = useState(0)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 50

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    setIsLoading(true)
    
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await axios.post("https://dtu-rm-portal.onrender.com", formData)
      setStudents(response.data.data)
      setDebarredIds(new Set())
      setCurrentPage(1)
    } catch (error) {
      alert("Upload failed. Is the backend running?")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDebarred = (key) => {
    setDebarredIds((prev) => {
      const newSet = new Set(prev)
      newSet.has(key) ? newSet.delete(key) : newSet.add(key)
      return newSet
    })
  }

  // 1. Data for Statistics & Export (STRICTLY active and shortlisted)
  const activeShortlist = useMemo(() => {
    return students.filter((student, index) => {
      const isDebarred = debarredIds.has(`student_${index}`)
      const score = Number(student.Total) || 0
      return score >= minScore && !isDebarred
    })
  }, [students, debarredIds, minScore])

  // 2. Data for the Table UI (Includes debarred so you can undo them!)
  const tableData = useMemo(() => {
    return students.filter((student) => {
      const score = Number(student.Total) || 0
      const matchesSearch = Object.values(student).some(val => 
        String(val).toLowerCase().includes(search.toLowerCase())
      )
      return score >= minScore && matchesSearch
    }).sort((a, b) => (Number(b.Total) || 0) - (Number(a.Total) || 0)) // Auto-sort by Total
  }, [students, minScore, search])

  // Statistics Calculations
  const totalCandidates = students.length
  const shortlistedCount = activeShortlist.length
  const avgScore = shortlistedCount > 0 
    ? (activeShortlist.reduce((sum, s) => sum + (Number(s.Total) || 0), 0) / shortlistedCount).toFixed(2) 
    : 0

  const maxPossibleScore = students.length > 0 ? Math.max(...students.map(s => Number(s.Total) || 0), 100) : 100

  // Pagination Logic (Based on tableData, not activeShortlist)
  const totalPages = Math.ceil(tableData.length / rowsPerPage)
  const paginatedData = tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  // Export Logic
  const exportToCSV = () => {
    if (activeShortlist.length === 0) {
      alert("No active candidates to export.")
      return
    }
    const headers = Object.keys(activeShortlist[0])
    const csvRows = [
      headers.join(','),
      ...activeShortlist.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(','))
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DTU_Shortlist_MinScore_${minScore}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto', color: '#1a1a1a' }}>
      <header style={{ borderBottom: '2px solid #0056b3', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: '#0056b3' }}>DTU RM Portal v2.0</h1>
      </header>

      <section style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h3>1. Upload Dataset</h3>
        <input type="file" accept=".csv" onChange={handleFileUpload} disabled={isLoading} />
        {isLoading && <span style={{ marginLeft: '12px', color: '#0056b3', fontWeight: 'bold' }}>⏳ Processing...</span>}
      </section>

      {students.length > 0 && (
        <>
          <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'center' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Min Score: {minScore}</label>
                <input type="range" min="0" max={maxPossibleScore} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} style={{ width: '100%' }} />
                
                <label style={{ fontWeight: 'bold', display: 'block', marginTop: '16px', marginBottom: '8px' }}>Search Candidates</label>
                <input type="text" placeholder="Search by name, branch, etc..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, backgroundColor: '#e9ecef', padding: '16px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px' }}>TOTAL STUDENTS</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalCandidates}</div>
                </div>
                <div style={{ flex: 1, backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '6px', textAlign: 'center', color: '#0d47a1' }}>
                  <div style={{ fontSize: '12px' }}>ACTIVE SHORTLIST</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{shortlistedCount}</div>
                </div>
                <div style={{ flex: 1, backgroundColor: '#e8f5e9', padding: '16px', borderRadius: '6px', textAlign: 'center', color: '#1b5e20' }}>
                  <div style={{ fontSize: '12px' }}>AVG SCORE</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{avgScore}</div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={exportToCSV} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>
                📥 Export Active CSV ({shortlistedCount})
              </button>
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3>3. Candidate Roster</h3>
              <div>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ marginRight: '8px' }}>◀ Prev</button>
                <span>Page {currentPage} of {totalPages || 1}</span>
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={{ marginLeft: '8px' }}>Next ▶</button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: '8px', maxHeight: '600px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f1f3f5', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Status</th>
                    {Object.keys(students[0]).map(col => (
                      <th key={col} style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? paginatedData.map((student) => {
                    const originalIndex = students.indexOf(student) 
                    const key = `student_${originalIndex}`
                    const isDebarred = debarredIds.has(key)
                    
                    return (
                      <tr key={key} style={{ borderBottom: '1px solid #e9ecef', backgroundColor: isDebarred ? '#ffebee' : '#fff', opacity: isDebarred ? 0.7 : 1 }}>
                        <td style={{ padding: '12px' }}>
                          <button onClick={() => toggleDebarred(key)} style={{ backgroundColor: isDebarred ? '#6c757d' : '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                            {isDebarred ? 'Undo Debar' : 'Debar'}
                          </button>
                        </td>
                        {Object.keys(student).map((col) => (
                          <td key={col} style={{ padding: '12px', backgroundColor: student[col] === 'Unknown' ? '#fff3cd' : 'transparent' }}>
                            {String(student[col])}
                          </td>
                        ))}
                      </tr>
                    )
                  }) : (
                    <tr><td colSpan="100%" style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No candidates found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default App