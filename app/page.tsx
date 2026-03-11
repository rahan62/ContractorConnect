import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect bare domain to default locale
  redirect("/tr");
}

