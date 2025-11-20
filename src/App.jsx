import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./pages/Dashboards/DashBoardMain/Dashboard";
import PrivateRoute from "./PrivateRoute";
import Solicitacao from "./Solicitacao";
import Header from "./Header";
import { Toaster } from "react-hot-toast";
import DashboardUsers from "./pages/Dashboards/DashboardUsers/DashboardUsers";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/solicitacao"
            element={
              <div>
                {" "}
                <PrivateRoute>
                  <Header />
                  <Solicitacao />
                </PrivateRoute>
              </div>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Header />
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/users"
            element={
              <PrivateRoute>
                <Header />
                <DashboardUsers />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </>
  );
}
