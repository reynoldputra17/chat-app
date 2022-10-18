import logo from './logo.svg';
import Login  from './pages/Login'
import Chat from './pages/Chat'
import {
  BrowserRouter,
  Switch,
  Routes,
  Route,
  Link,
  Navigate
} from "react-router-dom";
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext.';

function App() {
  const {currentUser} = useContext(AuthContext)

  const ProtectedRoute = () => {
    if(!currentUser) {
        return <Navigate to="/login" />
     }
     return <Chat />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
          } />
          <Route path="login" element={<Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
