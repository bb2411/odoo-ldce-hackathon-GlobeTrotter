import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Sinup";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/signup" replace />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

      <Route
        path="/login"
        element={<Login />}
      />
    </Routes>
  );
}

export default App;