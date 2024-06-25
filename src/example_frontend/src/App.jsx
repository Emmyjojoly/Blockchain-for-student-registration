import React, { useState, useEffect } from 'react';
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import { example_backend } from 'declarations/example_backend'; // Adjust the path as necessary
import './index.scss';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [students, setStudents] = useState([]);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [showViewStudentList, setShowViewStudentList] = useState(false);
  const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', fathersName: '', mothersName: '', phoneNumber: '', email: '', school: 'IPRC-NGOMA' });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [message, setMessage] = useState('');

  const authClientPromise = AuthClient.create();

  const signIn = async () => {
    const authClient = await authClientPromise;
    const internetIdentityUrl = process.env.NODE_ENV === 'production'
      ? undefined
      : `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`;

    await new Promise((resolve) => {
      authClient.login({
        identityProvider: internetIdentityUrl,
        onSuccess: () => resolve(undefined),
      });
    });

    const identity = authClient.getIdentity();
    updateIdentity(identity);
    setIsLoggedIn(true);
  };

  const signOut = async () => {
    const authClient = await authClientPromise;
    await authClient.logout();
    updateIdentity(null);
    setIsLoggedIn(false);
  };

  const updateIdentity = (identity) => {
    if (identity) {
      setPrincipal(identity.getPrincipal());
      const agent = new HttpAgent({ identity });
      const actor = Actor.createActor(example_backend, { agent });
      example_backend.setActor(actor);
    } else {
      setPrincipal(null);
      example_backend.setActor(null);
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const authClient = await authClientPromise;
      const isAuthenticated = await authClient.isAuthenticated();
      setIsLoggedIn(isAuthenticated);
      if (isAuthenticated) {
        const identity = authClient.getIdentity();
        updateIdentity(identity);
      }
    };

    checkLoginStatus();
  }, []);

  const fetchStudents = async () => {
    try {
      const studentsList = await example_backend.getStudents();
      setStudents(studentsList);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const handleAddStudent = async (event) => {
    event.preventDefault();
    try {
      if (editingStudent) {
        await example_backend.updateStudent(editingStudent.id, newStudent.firstName, newStudent.lastName, newStudent.fathersName, newStudent.mothersName, newStudent.phoneNumber, newStudent.email, newStudent.school);
        setMessage("Student updated successfully");
      } else {
        await example_backend.addStudent(newStudent.firstName, newStudent.lastName, newStudent.fathersName, newStudent.mothersName, newStudent.phoneNumber, newStudent.email, newStudent.school);
        setMessage("Student added successfully");
      }
      setNewStudent({ firstName: '', lastName: '', fathersName: '', mothersName: '', phoneNumber: '', email: '', school: 'IPRC-NGOMA' });
      setShowAddStudentForm(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      setMessage("Failed to add/update student");
    }
  };

  const handleEditStudent = (student) => {
    setNewStudent({ firstName: student.firstName, lastName: student.lastName, fathersName: student.fathersName, mothersName: student.mothersName, phoneNumber: student.phoneNumber, email: student.email, school: student.school });
    setEditingStudent(student);
    setShowAddStudentForm(true);
    setShowViewStudentList(false);
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await example_backend.deleteStudent(studentId);
      setMessage("Student deleted successfully");
      fetchStudents();
    } catch (error) {
      setMessage("Failed to delete student");
    }
  };

  const handleFetchStudents = () => {
    fetchStudents();
    setShowViewStudentList(true);
    setShowAddStudentForm(false);
    setEditingStudent(null);
  };

  return (
    <main>
      <h1>STUDENT REGISTRATION SYSTEM</h1>
      {message && <p className="message">{message}</p>}
      {isLoggedIn ? (
        <>
          <p>Welcome back, {principal ? principal.toString() : "User"}!</p>
          <button onClick={signOut}>Sign Out</button>
          <button onClick={() => { setShowAddStudentForm(true); setShowViewStudentList(false); }}>Add New Student</button>
          <button onClick={handleFetchStudents}>View Students</button>
          {showViewStudentList && (
            <table>
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Father Name</th>
                  <th>Mother Name</th>
                  <th>Phone NUmber</th>
                  <th>Email</th>
                  <th>School</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.firstName}</td>
                    <td>{student.lastName}</td>
                    <td>{student.fathersName}</td>
                    <td>{student.mothersName}</td>
                    <td>{student.phoneNumber}</td>
                    <td>{student.email}</td>
                    <td>{student.school}</td>
                    
                    <td> <button onClick={() => handleEditStudent(student)}>Edit</button></td>
                    <td> <button onClick={() => handleDeleteStudent(student.id)}>Delete</button></td>
                    <td> <button onClick={() => handleViewStudent(student)}>View</button></td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {showAddStudentForm && (
            <form onSubmit={handleAddStudent}>
              <label>
                First Name:
                <input
                  type="text"
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                  required
                />
              </label>
              <label>
                Last Name:
                <input
                  type="text"
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                  required
                />
              </label>

              <label>
                Father Name:
                <input
                  type="text"
                  value={newStudent.fathersName}
                  onChange={(e) => setNewStudent({ ...newStudent, fathersName: e.target.value })}
                  required
                />
              </label>

              <label>
                Mother Name:
                <input
                  type="text"
                  value={newStudent.mothersName}
                  onChange={(e) => setNewStudent({ ...newStudent, mothersName: e.target.value })}
                  required
                />
              </label>

              <label>
                Phone number
                <input
                  type="text"
                  value={newStudent.phoneNumber}
                  onChange={(e) => setNewStudent({ ...newStudent, phoneNumber: e.target.value })}
                  required
                />
              </label>

              <label>
                Email:
                <input
                  type="text"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  required
                />
              </label>

              <label>
                School:
                <select
                  value={newStudent.school}
                  onChange={(e) => setNewStudent({ ...newStudent, school: e.target.value })}
                  required
                >
                  <option value="IPRC-NGOMA">IPRC-NGOMA</option>
                  <option value="IPRC-MUSANZE">IPRC-MUSANZE</option>
                  <option value="IPRC-TUMBA">IPRC-TUMBA</option>
                  <option value="IPRC-TUMBA">IPRC-KIGALI</option>
                  <option value="IPRC-TUMBA">IPRC-KITABI</option>
                  <option value="IPRC-TUMBA">IPRC-GISHARI</option>
                  <option value="IPRC-TUMBA">IPRC-HUYE</option>
                  <option value="IPRC-TUMBA">IPRC-KARONGI</option>
                </select>
              </label>
              <button type="submit">{editingStudent ? "Update Student" : "Save Student"}</button>
            </form>
          )}
          {selectedStudent && (
            <div className="student-details">
              <h2>Student Details</h2>
              <p><strong>First Name:</strong> {selectedStudent.firstName}</p>
              <p><strong>Last Name:</strong> {selectedStudent.lastName}</p>
              <p><strong>Father Name:</strong> {selectedStudent.fathersName}</p>
              <p><strong>Mother Name:</strong> {selectedStudent.mothersName}</p>
              <p><strong>Phone Number:</strong> {selectedStudent.phoneNumber}</p>
              <p><strong>Email:</strong> {selectedStudent.email}</p>
              <p><strong>School:</strong> {selectedStudent.school}</p>
              <button onClick={() => setSelectedStudent(null)}>Close</button>
            </div>
          )}
        </>
      ) : (
        <button onClick={signIn}>Sign In</button>
      )}
    </main>
  );
}

export default App;
