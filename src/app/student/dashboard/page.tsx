import StudentDashboard from "@/components/student/StudentDashboard";
import { getUserProfile } from "@/lib/actions";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
    const user = await getUserProfile();
    return <StudentDashboard initialUser={user} />;
}
