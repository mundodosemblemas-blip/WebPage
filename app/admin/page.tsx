import AdminGate from "../components/AdminGate";
import AdminDashboard from "./AdminDashboard";

export const metadata = {
  title: "Administração — Pin Quest",
};

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
