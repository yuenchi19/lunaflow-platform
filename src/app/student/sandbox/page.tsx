import { redirect } from "next/navigation";

export default function SandboxPage() {
    redirect("/student/dashboard?unlocked=true");
}
