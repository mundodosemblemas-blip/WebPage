import AdminGate from "../components/AdminGate";
import AdminDashboard from "./AdminDashboard";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administração",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
