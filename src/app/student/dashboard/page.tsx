import StudentDashboard from "@/components/student/StudentDashboard";
import { getUserProfile } from "@/lib/actions";

export default async function Page() {
    const user = await getUserProfile();
    return <StudentDashboard initialUser={user} />;
}
