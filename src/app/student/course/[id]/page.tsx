import CourseDashboard from "@/components/student/CourseDashboard";

export default function StudentCoursePage({ params }: { params: { id: string } }) {
    return <CourseDashboard courseId={params.id} />;
}
