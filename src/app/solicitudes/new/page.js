import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserByEmail } from "@/app/lib/backend";
import SolicitudForm from "./SolicitudForm";

export default async function NuevaSolicitudPage() {
  const session = await auth();
  if (!session) redirect("/");

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return (
      <div className="card" style={{padding:18}}>
        <h2 style={{fontWeight:800, fontSize:20}}>Tu cuenta no está registrada</h2>
        <p>Correo: {session.user.email}</p>
      </div>
    );
  }

  return <SolicitudForm user={user} />;
}
